import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { Session, TimetableClassCourse } from "../types";
import type { TimetableFilters } from "./use-timetable-filters";

/** Class courses matching the year / class / teacher filters. */
export function useTimetableClassCourses({
	academicYearId,
	classId,
	teacherId,
}: Pick<TimetableFilters, "academicYearId" | "classId" | "teacherId">) {
	const { data } = useQuery({
		queryKey: [
			"classCourses-for-timetable",
			academicYearId,
			classId,
			teacherId,
		],
		queryFn: async () => {
			const { items } = await trpcClient.classCourses.list.query({
				...(academicYearId ? { academicYearId } : {}),
				...(classId ? { classId } : {}),
				...(teacherId ? { teacherId } : {}),
				limit: 500,
			});
			return items as TimetableClassCourse[];
		},
	});
	return data ?? [];
}

/** Teachers offered in the teacher filter. */
export function useTimetableTeachers() {
	const { data } = useQuery({
		queryKey: ["teachers-for-timetable-filter"],
		queryFn: async () => {
			const { items } = await trpcClient.users.list.query({
				role: "teacher",
				limit: 500,
			});
			return items;
		},
	});
	return data ?? [];
}

/** Sessions matching the filters; a selected course wins over class/teacher. */
export function useTimetableSessions({
	academicYearId,
	semesterId,
	classId,
	teacherId,
	classCourseId,
}: TimetableFilters) {
	const query = useQuery(
		trpc.timetable.list.queryOptions({
			...(classCourseId ? { classCourseId } : {}),
			...(classId && !classCourseId ? { classId } : {}),
			...(teacherId && !classCourseId ? { teacherId } : {}),
			...(academicYearId ? { academicYearId } : {}),
			...(semesterId ? { semesterId } : {}),
		}),
	);
	const sessions: Session[] = query.data ?? [];
	return { ...query, sessions };
}

/** Refreshes every timetable list. */
export function useInvalidateTimetable() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries(trpc.timetable.list.queryFilter({}));
	};
}

/** Deletes a timetable session. */
export function useDeleteSession() {
	const { t } = useTranslation();
	const invalidate = useInvalidateTimetable();
	return useMutation({
		mutationFn: (id: string) => trpcClient.timetable.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("teacher.timetable.toast.deleted"));
			invalidate();
		},
		onError: (err) => toast.error(err.message),
	});
}
