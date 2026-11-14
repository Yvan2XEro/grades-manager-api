import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/**
 * Courses of the signed-in student's class, the courses they are enrolled in,
 * the open enrollment window and the self enroll / unenroll mutations.
 */
export function useMyCourseEnrollments() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const studentQuery = useQuery(trpc.students.me.queryOptions());
	const studentId = studentQuery.data?.id ?? "";
	const classId = studentQuery.data?.class ?? "";

	const windowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);

	const classCoursesQuery = useQuery({
		queryKey: ["class-courses-student", classId],
		enabled: Boolean(classId),
		queryFn: () => trpcClient.classCourses.list.query({ classId, limit: 200 }),
	});

	const myEnrollmentsQuery = useQuery({
		queryKey: ["my-course-enrollments", studentId],
		enabled: Boolean(studentId),
		queryFn: () =>
			trpcClient.studentCourseEnrollments.list.query({ studentId, limit: 200 }),
	});

	const enrollMutation = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.workflows.studentSelfEnroll.mutate({ classCourseId }),
		onSuccess: () => {
			toast.success(t("student.enrollments.enrolled"));
			queryClient.invalidateQueries({
				queryKey: ["my-course-enrollments", studentId],
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const unenrollMutation = useMutation({
		mutationFn: (classCourseId: string) =>
			trpcClient.workflows.studentSelfUnenroll.mutate({ classCourseId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["my-course-enrollments", studentId],
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const openWindow = windowsQuery.data?.find(
		(w) => w.classId === classId && w.status === "open",
	);

	const enrolledIds = new Set(
		(myEnrollmentsQuery.data?.items ?? [])
			.filter((e) => e.status !== "withdrawn")
			.map((e) => e.classCourseId),
	);

	const courses = classCoursesQuery.data?.items ?? [];

	const isLoading =
		studentQuery.isPending ||
		classCoursesQuery.isPending ||
		myEnrollmentsQuery.isPending;

	const busy = enrollMutation.isPending || unenrollMutation.isPending;

	return {
		windowsQuery,
		openWindow,
		enrolledIds,
		courses,
		isLoading,
		busy,
		enrollMutation,
		unenrollMutation,
	};
}
