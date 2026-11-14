import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { EnrollmentRow, EnrollmentStatusFilter } from "../types";

export interface EnrollmentFilters {
	academicYearId: string;
	classId: string;
	semesterId: string;
	status: EnrollmentStatusFilter;
}

/**
 * Everything the enrollments page reads for its filters: classes of the year,
 * one page of enrollments (joined with the students of the class), the class
 * courses and the enrollment window of the class.
 */
export function useEnrollments(
	{ academicYearId, classId, semesterId, status }: EnrollmentFilters,
	{ page, pageSize }: { page: number; pageSize: number },
) {
	useQuery(trpc.semesters.list.queryOptions({ limit: 100 }));

	const classesQuery = useQuery(
		trpc.classes.list.queryOptions({
			academicYearId: academicYearId || undefined,
			limit: 200,
		}),
	);

	const enrollmentsQuery = useQuery({
		...trpc.enrollments.listPaged.queryOptions({
			page,
			pageSize,
			classId: classId || undefined,
			academicYearId: academicYearId || undefined,
			status: status === "all" ? undefined : status,
		}),
		enabled: Boolean(academicYearId && classId),
	});

	const studentsQuery = useQuery({
		...trpc.students.list.queryOptions({
			classId: classId || undefined,
			limit: 100,
		}),
		enabled: Boolean(classId),
	});

	const classCoursesQuery = useQuery({
		...trpc.classCourses.list.queryOptions({
			classId: classId || undefined,
			semesterId: semesterId || undefined,
			limit: 100,
		}),
		enabled: Boolean(classId),
	});

	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const students = studentsQuery.data?.items;
	const rows = useMemo<EnrollmentRow[]>(
		() =>
			(enrollmentsQuery.data?.items ?? []).map((enrollment) => ({
				...enrollment,
				student: students?.find((s) => s.id === enrollment.studentId),
			})),
		[enrollmentsQuery.data?.items, students],
	);

	const windowStatus = useMemo(() => {
		if (!classId || !academicYearId) return null;
		return windowsQuery.data?.find(
			(entry) =>
				entry.classId === classId && entry.academicYearId === academicYearId,
		);
	}, [windowsQuery.data, academicYearId, classId]);

	const classes = classesQuery.data?.items;
	const selectedClass = useMemo(
		() => classes?.find((klass) => klass.id === classId),
		[classes, classId],
	);

	return {
		classes: classes ?? [],
		selectedClass,
		rows,
		page: enrollmentsQuery.data,
		isLoading: enrollmentsQuery.isLoading,
		students: students ?? [],
		studentsCount: students?.length ?? 0,
		classCoursesCount: classCoursesQuery.data?.items?.length ?? 0,
		windowStatus,
	};
}

/** Opens or closes the enrollment window of a class for a year. */
export function useToggleEnrollmentWindow(
	classId: string,
	academicYearId: string,
) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (action: "open" | "close") =>
			trpcClient.workflows.enrollmentWindow.mutate({
				classId,
				academicYearId,
				action,
			}),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.updated", {
					defaultValue: "Window updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.workflows.enrollmentWindows.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});
}

/** Deletes several enrollments and refreshes the list. */
export function useDeleteEnrollments() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.enrollments.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.enrollments.listPaged.queryKey());
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});
}
