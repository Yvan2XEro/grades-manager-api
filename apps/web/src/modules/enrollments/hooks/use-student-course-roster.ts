import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { CourseEnrollmentRow, PrerequisiteWarning } from "../types";

interface StudentCourseRosterParams {
	studentId: string;
	classId: string;
	semesterId?: string;
}

/**
 * Class courses of a student with their enrollment, plus the enroll / withdraw
 * / restore mutations and the prerequisite warnings returned per course.
 */
export function useStudentCourseRoster({
	studentId,
	classId,
	semesterId,
}: StudentCourseRosterParams) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [courseWarnings, setCourseWarnings] = useState<
		Record<string, PrerequisiteWarning[]>
	>({});

	const classCoursesQuery = useQuery(
		trpc.classCourses.list.queryOptions({
			classId,
			semesterId,
			limit: 100,
		}),
	);

	const courseEnrollmentQuery = useQuery(
		trpc.studentCourseEnrollments.list.queryOptions({
			studentId,
			limit: 200,
		}),
	);

	const rosterByClassCourse = useMemo(() => {
		const map = new Map<string, CourseEnrollmentRow>();
		courseEnrollmentQuery.data?.items?.forEach((item) => {
			map.set(item.classCourseId, item);
		});
		return map;
	}, [courseEnrollmentQuery.data?.items]);

	const assignCourse = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.studentCourseEnrollments.create.mutate({
				studentId,
				classCourseId,
				status: "active",
			}),
		onSuccess: (result, classCourseIdParam) => {
			toast.success(
				t("admin.enrollments.toast.courseEnrolled", {
					defaultValue: "Student enrolled in course",
				}),
			);
			if (classCourseIdParam) {
				setCourseWarnings((prev) => {
					const next = { ...prev };
					if (result.warnings?.length) {
						next[classCourseIdParam] = result.warnings;
					} else {
						delete next[classCourseIdParam];
					}
					return next;
				});
			}
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const withdrawCourse = useMutation({
		mutationFn: (payload: { id: string; status: "withdrawn" | "completed" }) =>
			trpcClient.studentCourseEnrollments.updateStatus.mutate(payload),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.courseWithdrawn", {
					defaultValue: "Enrollment updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const reactivateCourse = useMutation({
		mutationFn: (id: string) =>
			trpcClient.studentCourseEnrollments.updateStatus.mutate({
				id,
				status: "active",
			}),
		onSuccess: () => {
			toast.success(
				t("admin.enrollments.toast.courseReactivated", {
					defaultValue: "Enrollment restored",
				}),
			);
			queryClient.invalidateQueries(
				trpc.studentCourseEnrollments.list.queryKey(),
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return {
		classCoursesQuery,
		rosterByClassCourse,
		courseWarnings,
		assignCourse,
		withdrawCourse,
		reactivateCourse,
	};
}
