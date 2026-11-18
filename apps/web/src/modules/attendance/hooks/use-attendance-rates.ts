import { useQuery } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";
import type { StudentRateRow } from "../types";

/** Attendance rate of every student of a class course, best first. */
export function useStudentAttendanceRates(
	classCourseId: string | null,
	academicYearId: string | null,
) {
	const ratesQuery = useQuery({
		...trpc.attendance.getAttendanceRates.queryOptions({
			classCourseId: classCourseId ?? "",
			...(academicYearId ? { academicYearId } : {}),
		}),
		enabled: !!classCourseId,
	});

	// Student profiles for display
	const studentsQuery = useQuery({
		queryKey: ["students-for-rates", classCourseId],
		queryFn: async () => {
			if (!classCourseId) return [];
			return trpcClient.attendance.getRoster.query({ classCourseId });
		},
		enabled: !!classCourseId,
	});

	const roster = studentsQuery.data ?? [];
	const studentNames = new Map(
		roster.map((r) => [
			r.studentId,
			r.student?.profile
				? `${r.student.profile.firstName} ${r.student.profile.lastName}`
				: r.studentId,
		]),
	);
	const studentNumbers = new Map(
		roster.map((r) => [r.studentId, r.student?.registrationNumber ?? ""]),
	);

	const rates = ratesQuery.data;
	const rows: StudentRateRow[] = (rates?.students ?? []).map((s) => ({
		...s,
		id: s.studentId,
		name: studentNames.get(s.studentId) ?? s.studentId,
		registrationNumber: studentNumbers.get(s.studentId),
	}));

	return {
		/** Export order: as returned by the server. */
		rows,
		/** Table order: highest rate first. */
		sortedRows: [...rows].sort((a, b) => b.rate - a.rate),
		totalSessions: rates?.totalSessions ?? 0,
		threshold: rates?.threshold ?? null,
		isPending: ratesQuery.isPending,
	};
}

/** Attendance summary of each course of the signed-in teacher. */
export function useTeacherCoursesRates(academicYearId: string | null) {
	const { data, isLoading } = useQuery({
		queryKey: ["teacher-attendance-rates", academicYearId],
		queryFn: () =>
			trpcClient.attendance.myCoursesRates.query(
				academicYearId ? { academicYearId } : {},
			),
		enabled: academicYearId !== null,
	});
	return {
		rows: (data ?? []).map((row) => ({ ...row, id: row.classCourseId })),
		isLoading,
	};
}

/** Attendance rate of each course of a class. */
export function useClassAttendanceOverview(
	classId: string | null,
	academicYearId: string | null,
) {
	const { data: classesData } = useQuery({
		queryKey: ["classes-for-overview", academicYearId],
		queryFn: async () => {
			const { items } = await trpcClient.classes.list.query({
				...(academicYearId ? { academicYearId } : {}),
				limit: 500,
			});
			return items as { id: string; name: string }[];
		},
	});

	const overviewQuery = useQuery({
		...trpc.attendance.getClassAttendanceOverview.queryOptions({
			classId: classId ?? "",
			academicYearId: academicYearId ?? "",
		}),
		enabled: !!classId && !!academicYearId,
	});

	return {
		classes: classesData ?? [],
		rows: (overviewQuery.data ?? []).map((row) => ({
			...row,
			id: row.classCourseId,
		})),
		isLoading: overviewQuery.isLoading,
	};
}
