import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { upsertInList } from "@/lib/query-cache";
import { ClassCourseFormDialog } from "@/modules/classes/components/class-course-form-dialog";
import {
	CLASSES_KEY,
	COURSES_KEY,
	fetchClassOptions,
	fetchCourseOptions,
} from "@/modules/classes/hooks/use-class-options";
import { trpcClient } from "@/utils/trpc";
import type { ClassCourseOption, ExamFormValuesIn } from "../types";

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
 * Form state of the exam dialog: values, class-course options (labelled
 * "course - class") and in-place creation of a missing class-course.
 */
export function useExamForm(exam?: ExamFormValuesIn) {
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

	const { data: classCourses = [] } = useQuery({
		queryKey: examFormKeys.classCourses,
		queryFn: fetchExamClassCourses,
	});
	const { data: classes = [] } = useQuery({
		queryKey: examFormKeys.classes,
		queryFn: fetchClassOptions,
	});
	const { data: courses = [] } = useQuery({
		queryKey: examFormKeys.courses,
		queryFn: fetchCourseOptions,
	});
	const classMap = new Map(classes.map((c) => [c.id, c.name]));
	const courseMap = new Map(courses.map((c) => [c.id, c.name]));
	const classCourseOptions = classCourses.map((cc) => ({
		id: cc.id,
		label: `${courseMap.get(cc.course) ?? ""} - ${classMap.get(cc.class) ?? ""}`,
	}));

	const createClassCourse = async () => {
		const created = await ClassCourseFormDialog.call({
			existingCodes: [],
		});
		if (!created) return;
		// The labels come from the class and course lists: refresh them too
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: examFormKeys.classes }),
			queryClient.invalidateQueries({ queryKey: examFormKeys.courses }),
		]);
		queryClient.setQueryData<ClassCourseOption[]>(
			examFormKeys.classCourses,
			(old) =>
				upsertInList(old ?? [], {
					id: created.id,
					class: created.class,
					course: created.course,
				}),
		);
		form.setValue("classCourseId", created.id, { shouldValidate: true });
	};

	return { form, classCourseOptions, createClassCourse };
}
