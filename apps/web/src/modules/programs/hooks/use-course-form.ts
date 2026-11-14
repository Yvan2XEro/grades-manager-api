import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { upsertInList } from "@/lib/query-cache";
import { classFormKeys } from "@/modules/classes/hooks/use-class-form";
import { trpcClient } from "@/utils/trpc";
import { ProgramFormDialog } from "../components/program-form-dialog";
import { TeachingUnitFormDialog } from "../components/teaching-unit-form-dialog";
import type { EditableCourse, ProgramListItem } from "../types";
import { useTeachers } from "./use-teachers";

type TeachingUnitOption = { id: string; code: string; name: string };

const buildCourseSchema = (t: (key: string, options?: any) => string) =>
	z.object({
		name: z.string().min(2, t("admin.courses.validation.name")),
		hours: z.coerce.number().min(1, t("admin.courses.validation.hours")),
		program: z.string({ error: t("admin.courses.validation.program") }),
		teachingUnitId: z.string().min(
			1,
			t("admin.teachingUnits.validation.required", {
				defaultValue: "Select a teaching unit",
			}),
		),
		defaultTeacher: z.string({
			error: t("admin.courses.validation.teacher"),
		}),
		code: z
			.string()
			.trim()
			.min(
				2,
				t("admin.courses.validation.code", {
					defaultValue: "Code is required",
				}),
			),
	});

type CourseSchema = ReturnType<typeof buildCourseSchema>;
export type CourseFormInput = z.input<CourseSchema>;
export type CourseFormData = z.output<CourseSchema>;

interface Options {
	course?: EditableCourse;
	defaults?: { program?: string; teachingUnitId?: string };
}

/**
 * Form state of `CourseFormDialog`: the program search, the teaching units of
 * the selected program, the teachers, and in-place creation of a program or a
 * teaching unit (written into the cache feeding their select).
 */
export function useCourseForm({ course, defaults }: Options) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [programSearch, setProgramSearch] = useState("");

	const schema = useMemo(() => buildCourseSchema(t), [t]);
	const form = useForm<CourseFormInput, unknown, CourseFormData>({
		resolver: zodResolver(schema),
		defaultValues: course
			? {
					name: course.name,
					hours: course.hours,
					program: course.program,
					teachingUnitId: course.teachingUnitId ?? "",
					defaultTeacher: course.defaultTeacher,
					code: course.code,
				}
			: {
					name: "",
					hours: 0,
					program: defaults?.program ?? "",
					teachingUnitId: defaults?.teachingUnitId ?? "",
					defaultTeacher: "",
					code: "",
				},
	});

	const { data: defaultPrograms = [] } = useQuery({
		queryKey: classFormKeys.programs,
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as ProgramListItem[];
		},
	});
	const { data: searchPrograms = [] } = useQuery({
		queryKey: ["programs", "search", programSearch],
		queryFn: async () =>
			(await trpcClient.programs.search.query({
				query: programSearch,
			})) as ProgramListItem[],
		enabled: programSearch.length >= 2,
	});
	const programs = programSearch.length >= 2 ? searchPrograms : defaultPrograms;

	const selectedProgramId = form.watch("program");
	const teachingUnitsKey = ["teachingUnits", selectedProgramId];
	const { data: teachingUnits = [] } = useQuery({
		queryKey: teachingUnitsKey,
		queryFn: async () => {
			const { items } = await trpcClient.teachingUnits.list.query({
				programId: selectedProgramId,
			});
			return items as TeachingUnitOption[];
		},
		enabled: Boolean(selectedProgramId),
	});

	const { data: teachers = [] } = useTeachers();

	const createProgram = async () => {
		const program = await ProgramFormDialog.call({});
		if (!program) return;
		const option = { ...program, optionsCount: 0 };
		queryClient.setQueryData<ProgramListItem[]>(classFormKeys.programs, (old) =>
			upsertInList(old, option),
		);
		setProgramSearch("");
		form.setValue("program", program.id, { shouldValidate: true });
		return option;
	};

	const createTeachingUnit = async () => {
		if (!selectedProgramId) return;
		const unit = await TeachingUnitFormDialog.call({
			programId: selectedProgramId,
		});
		if (!unit) return;
		queryClient.setQueryData<TeachingUnitOption[]>(teachingUnitsKey, (old) =>
			upsertInList(old ?? [], unit),
		);
		form.setValue("teachingUnitId", unit.id, { shouldValidate: true });
	};

	return {
		form,
		programs,
		setProgramSearch,
		selectedProgramId,
		selectedProgramCode:
			programs.find((p) => p.id === selectedProgramId)?.code || null,
		teachingUnits,
		teachers,
		createProgram,
		createTeachingUnit,
	};
}

export type CourseFormController = ReturnType<typeof useCourseForm>;
