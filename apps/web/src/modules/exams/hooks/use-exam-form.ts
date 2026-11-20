import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ClassCourseFormDialog } from "@/modules/classes/components/class-course-form-dialog";
import {
	CLASSES_KEY,
	COURSES_KEY,
} from "@/modules/classes/hooks/use-class-options";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ClassCourseOption, ExamFormValuesIn } from "../types";

/** Courses listed by the picker at once; more are reached by searching. */
const CLASS_COURSE_PICKER_LIMIT = 50;

export type ClassCoursePickerOption = {
	id: string;
	code: string;
	name: string;
};

/**
 * Picker entry of a class course: "code · class" (unique — the same course
 * code is used in every class of a program) over the course name.
 */
const pickerOption = (
	id: string,
	code: string,
	courseName: string | null | undefined,
	className: string | null | undefined,
): ClassCoursePickerOption => ({
	id,
	code: className ? `${code} · ${className}` : code,
	name: courseName || code,
});

/** Query keys of the lists feeding the exam form (shared with the exams list). */
export const examFormKeys = {
	classCourses: ["classCourses"],
	classes: CLASSES_KEY,
	courses: COURSES_KEY,
} as const;

export const fetchExamClassCourses = async () =>
	(await trpcClient.classCourses.list.query({})).items as ClassCourseOption[];

function useExamSchema() {
	const { t } = useTranslation();
	return useMemo(
		() =>
			z.object({
				name: z.string().min(2, t("admin.exams.validation.name")),
				type: z.string().min(2, t("admin.exams.validation.type")),
				date: z.string().min(1, t("admin.exams.validation.date")),
				percentage: z
					.number()
					.min(1, t("admin.exams.validation.percentage.min"))
					.max(100, t("admin.exams.validation.percentage.max")),
				classCourseId: z.string({
					error: t("admin.exams.validation.classCourse"),
				}),
			}),
		[t],
	);
}

export type ExamFormData = z.infer<ReturnType<typeof useExamSchema>>;

/**
 * Form state of the exam dialog: values, the course picker (class courses of
 * the year, "course — class", searched on the server) and in-place creation
 * of a missing class-course.
 */
export function useExamForm(
	exam?: ExamFormValuesIn,
	academicYearId?: string | null,
) {
	const queryClient = useQueryClient();
	const schema = useExamSchema();

	const form = useForm<ExamFormData>({
		resolver: zodResolver(schema),
		defaultValues: exam
			? {
					name: exam.name,
					type: exam.type,
					date: exam.date.split("T")[0],
					percentage: exam.percentage,
					classCourseId: exam.classCourse,
				}
			: undefined,
	});

	// Weight check: the course's other regular exams + this one should make 100%
	const watchedClassCourseId = useWatch({
		control: form.control,
		name: "classCourseId",
	});
	const watchedPercentage = useWatch({
		control: form.control,
		name: "percentage",
	});
	const { data: courseExams } = useQuery({
		queryKey: ["exam-form-course-exams", watchedClassCourseId],
		enabled: Boolean(watchedClassCourseId),
		queryFn: async () =>
			(
				await trpcClient.exams.list.query({
					classCourseId: watchedClassCourseId,
				})
			).items,
	});
	const weightTotal =
		courseExams && watchedClassCourseId
			? courseExams
					.filter(
						(e) =>
							e.id !== exam?.id && (e.sessionType ?? "normal") === "normal",
					)
					.reduce((sum, e) => sum + Number(e.percentage), 0) +
				(Number(watchedPercentage) || 0)
			: null;

	// Course picker: the class courses of the year (the page's, else the
	// active one), searched on the server
	const yearsQuery = useQuery({
		...trpc.academicYears.list.queryOptions({}),
		enabled: !academicYearId,
	});
	const yearId =
		academicYearId ?? yearsQuery.data?.items.find((y) => y.isActive)?.id;
	const [classCourseSearch, setClassCourseSearch] = useState("");
	const searchQuery = useQuery({
		queryKey: ["exam-form-class-courses", yearId ?? null, classCourseSearch],
		enabled: Boolean(academicYearId) || !yearsQuery.isLoading,
		queryFn: () =>
			trpcClient.classCourses.search.query({
				query: classCourseSearch,
				academicYearId: yearId,
				limit: CLASS_COURSE_PICKER_LIMIT,
			}),
	});
	// The chosen course stays displayed whatever the search lists
	const [picked, setPicked] = useState<ClassCoursePickerOption | null>(
		exam?.classCourseCode
			? pickerOption(
					exam.classCourse,
					exam.classCourseCode,
					exam.courseName,
					exam.className,
				)
			: null,
	);
	const results = (searchQuery.data ?? []).map((cc) =>
		pickerOption(cc.id, cc.code, cc.courseName, cc.className),
	);
	const classCourseOptions =
		picked && !results.some((option) => option.id === picked.id)
			? [picked, ...results]
			: results;
	const classCoursePicker = {
		options: classCourseOptions,
		isLoading: searchQuery.isLoading || yearsQuery.isLoading,
		onSearch: setClassCourseSearch,
		/** More courses match than listed: the user should type to narrow. */
		truncated: results.length >= CLASS_COURSE_PICKER_LIMIT,
		select: (option: ClassCoursePickerOption | null) => {
			setPicked(option);
			form.setValue("classCourseId", option?.id ?? "", {
				shouldValidate: true,
			});
		},
	};

	const createClassCourse = async () => {
		const created = await ClassCourseFormDialog.call({
			existingCodes: [],
			academicYearId: yearId,
		});
		if (!created) return null;
		queryClient.invalidateQueries({ queryKey: ["exam-form-class-courses"] });
		queryClient.invalidateQueries({ queryKey: examFormKeys.classCourses });
		const option = pickerOption(created.id, created.code, null, null);
		classCoursePicker.select(option);
		return option;
	};

	return { form, classCoursePicker, createClassCourse, weightTotal };
}

export type ClassCoursePicker = ReturnType<
	typeof useExamForm
>["classCoursePicker"];
