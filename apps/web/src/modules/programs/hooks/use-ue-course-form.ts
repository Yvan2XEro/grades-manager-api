import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { generateCourseCode } from "@/lib/code-generator";
import { trpcClient } from "@/utils/trpc";
import type { UeCourse } from "../types";
import { useTeachers } from "./use-teachers";

const buildCourseSchema = (t: TFunction) =>
	z.object({
		name: z.string().min(
			2,
			t("admin.teachingUnits.courses.validation.name", {
				defaultValue: "Name is required",
			}),
		),
		hours: z.number().min(
			1,
			t("admin.teachingUnits.courses.validation.hours", {
				defaultValue: "Hours must be positive",
			}),
		),
		code: z.string().min(
			3,
			t("admin.teachingUnits.courses.validation.code", {
				defaultValue: "Code is required",
			}),
		),
		defaultTeacher: z.string().optional(),
		defaultCoefficient: z.coerce.number().positive().default(1),
	});

export type UeCourseFormData = z.infer<ReturnType<typeof buildCourseSchema>>;

interface Options {
	programId: string;
	semesterCode?: string;
	existingCodes: string[];
	course?: UeCourse;
}

/**
 * Form of `UeCourseFormDialog`; when creating, the code is suggested from the
 * program code and the semester until the user edits it.
 */
export function useUeCourseForm({
	programId,
	semesterCode,
	existingCodes,
	course,
}: Options) {
	const { t } = useTranslation();
	const courseSchema = useMemo(() => buildCourseSchema(t), [t]);

	const { data: teacherOptions = [] } = useTeachers();

	const { data: program } = useQuery({
		queryKey: ["program", programId],
		queryFn: () => trpcClient.programs.getById.query({ id: programId }),
		enabled: Boolean(programId),
	});

	const form = useForm<z.input<typeof courseSchema>, unknown, UeCourseFormData>(
		{
			resolver: zodResolver(courseSchema),
			defaultValues: course
				? {
						name: course.name,
						hours: course.hours,
						code: course.code,
						defaultTeacher: course.defaultTeacher,
						defaultCoefficient: course.defaultCoefficient,
					}
				: {
						name: "",
						hours: undefined as unknown as number,
						code: "",
						defaultTeacher: "",
						defaultCoefficient: 1,
					},
		},
	);
	const codeValue = form.watch("code");
	const codeDirty = Boolean(form.formState.dirtyFields.code);
	useEffect(() => {
		if (course || codeDirty || !program?.code) return;
		const suggestion = generateCourseCode({
			programCode: program.code,
			semesterCode,
			existingCodes,
		});
		if (suggestion && codeValue !== suggestion) {
			form.setValue("code", suggestion, { shouldDirty: false });
		}
	}, [
		codeDirty,
		codeValue,
		existingCodes,
		course,
		form,
		program?.code,
		semesterCode,
	]);

	return { form, teacherOptions };
}

export type UeCourseFormController = ReturnType<typeof useUeCourseForm>;
