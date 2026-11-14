import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import {
	fetchTeachers,
	formatTeacherName,
	TEACHERS_KEY,
} from "@/modules/programs/hooks/use-teachers";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ClassCourseRow } from "../types";
import {
	CLASSES_KEY,
	fetchClassOptions,
	useProgramNames,
} from "./use-class-options";

interface ClassCoursesFilters {
	page: number;
	pageSize: number;
	academicYearId: string | null;
	semesterId: string | null;
}

/** One page of course assignments, with class, program and teacher names resolved. */
export function useClassCourses({
	page,
	pageSize,
	academicYearId,
	semesterId,
}: ClassCoursesFilters) {
	const { data: classes = [] } = useQuery({
		queryKey: CLASSES_KEY,
		queryFn: fetchClassOptions,
	});
	const { data: teachers = [] } = useQuery({
		queryKey: TEACHERS_KEY,
		queryFn: fetchTeachers,
	});
	const programs = useProgramNames();
	const query = useQuery(
		trpc.classCourses.listPaged.queryOptions({
			page,
			pageSize,
			academicYearId: academicYearId || undefined,
			semesterId: semesterId || undefined,
		}),
	);

	const classById = new Map(classes.map((c) => [c.id, c]));
	const teacherById = new Map(teachers.map((t) => [t.id, t]));
	const classCourses = (query.data?.items ?? []).map((cc): ClassCourseRow => {
		const cls = classById.get(cc.class);
		const teacher = teacherById.get(cc.teacher);
		return {
			id: cc.id,
			code: cc.code,
			class: cc.class,
			course: cc.course,
			teacher: cc.teacher,
			semesterId: cc.semesterId ?? null,
			coefficient: Number(cc.coefficient) || 1,
			courseName: cc.courseName,
			courseCode: cc.courseCode,
			ueSemester: cc.ueSemester ?? null,
			className: cls?.name,
			programName: cls ? programs.get(cls.program)?.name : undefined,
			teacherName: teacher ? formatTeacherName(teacher) : undefined,
		};
	});
	return { ...query, classCourses };
}

/** Removes one or several course assignments and refreshes the list. */
export function useDeleteClassCourses() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.classCourses.delete.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries(trpc.classCourses.listPaged.queryKey());
			toast.success(
				ids.length === 1
					? t("admin.classCourses.toast.deleteSuccess")
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) => {
			toast.error(
				ids.length === 1 && error instanceof Error && error.message
					? error.message
					: ids.length === 1
						? t("admin.classCourses.toast.deleteError")
						: t("common.bulkActions.deleteError", {
								defaultValue: "Failed to delete items",
							}),
			);
		},
	});
}
