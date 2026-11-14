import { useQuery } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";
import type { DecisionResult, NotifItem, UpcomingExam } from "../types";

/** Every query of the student home page, plus the figures derived from them. */
export function useStudentDashboard() {
	const studentQuery = useQuery(trpc.students.me.queryOptions());
	const studentId = studentQuery.data?.id ?? "";

	const transcriptQuery = useQuery({
		queryKey: ["student-transcript", studentId],
		queryFn: () => trpcClient.grades.consolidatedByStudent.query({ studentId }),
		enabled: Boolean(studentId),
	});

	const ledgerQuery = useQuery({
		...trpc.studentCreditLedger.summary.queryOptions({ studentId }),
		enabled: Boolean(studentId),
	});

	const classId = studentQuery.data?.class ?? "";
	const classQuery = useQuery({
		...trpc.classes.getById.queryOptions({ id: classId }),
		enabled: Boolean(classId),
	});

	const decisionsQuery = useQuery(trpc.workflows.myDecisions.queryOptions());

	const feeHistoryQuery = useQuery(
		trpc.feeClearance.myFinancialHistory.queryOptions(),
	);

	const upcomingExamsQuery = useQuery(
		trpc.exams.upcomingForStudent.queryOptions(),
	);

	const notifQuery = useQuery(
		trpc.notifications.myNotifications.queryOptions({ limit: 20 }),
	);
	const unreadNotifs = (notifQuery.data?.items ?? []).filter(
		(n) => !n.readAt,
	) as NotifItem[];

	const enrollmentWindowsQuery = useQuery(
		trpc.workflows.enrollmentWindows.queryOptions(),
	);
	const openWindow = (enrollmentWindowsQuery.data ?? []).find(
		(w) => w.classId === classId && w.status === "open",
	);

	const student = studentQuery.data;
	const transcript = transcriptQuery.data;
	const ledger = ledgerQuery.data;
	const feeAssignments = feeHistoryQuery.data ?? [];

	const isLoading =
		studentQuery.isPending ||
		transcriptQuery.isPending ||
		ledgerQuery.isPending;

	const overallAvg = transcript?.overallAverage ?? 0;
	const creditsEarned = ledger?.creditsEarned ?? 0;
	const creditsRequired = ledger?.requiredCredits ?? 0;
	const creditsInProgress = ledger?.creditsInProgress ?? 0;
	const creditProgress =
		creditsRequired > 0
			? Math.min(100, (creditsEarned / creditsRequired) * 100)
			: 0;

	const fullName = student
		? `${student.profile.firstName} ${student.profile.lastName}`.trim()
		: "";

	const units = transcript?.units ?? [];
	const validatedUnits = units.filter((u) => u.average >= 10).length;

	const gradedUnits = units.filter((u) => u.courses.some((c) => c.average > 0));
	const onTrackUnits = gradedUnits.filter((u) => u.average >= 10).length;
	const projectionRate =
		gradedUnits.length > 0
			? Math.round((onTrackUnits / gradedUnits.length) * 100)
			: null;

	// Show fee widget only for the latest assignment
	const latestFeeAssignment =
		feeAssignments.length > 0 ? feeAssignments[0] : null;
	const feeNotCleared =
		latestFeeAssignment &&
		latestFeeAssignment.status !== "paid" &&
		latestFeeAssignment.status !== "exempt";

	return {
		student,
		classInfo: classQuery.data,
		isLoading,
		fullName,
		unreadNotifs,
		openWindow,
		decisionsPending: decisionsQuery.isPending,
		decisions: (decisionsQuery.data ?? []) as DecisionResult[],
		upcomingExams: (upcomingExamsQuery.data ?? []) as UpcomingExam[],
		latestFeeAssignment,
		feeNotCleared,
		overallAvg,
		creditsEarned,
		creditsRequired,
		creditsInProgress,
		creditProgress,
		units,
		validatedUnits,
		gradedUnitCount: gradedUnits.length,
		onTrackUnits,
		projectionRate,
	};
}
