import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/** Cohort analytics of the dean and the totals shown in the KPI row. */
export function useCohortAnalytics() {
	const analyticsQuery = useQuery(
		trpc.workflows.cohortAnalytics.queryOptions({}),
	);
	const cohorts = analyticsQuery.data ?? [];

	// Totals use the same definitions as the statistics page: ratios of sums,
	// not averages of per-class percentages (empty classes do not count).
	const totalStudents = cohorts.reduce((s, c) => s + c.totalStudents, 0);
	const totalPending = cohorts.reduce((s, c) => s + c.submittedExams, 0);
	const totalExams = cohorts.reduce((s, c) => s + c.totalExams, 0);
	const doneExams = cohorts.reduce(
		(s, c) => s + c.approvedExams + c.submittedExams,
		0,
	);
	const avgProgress =
		totalExams > 0 ? Math.round((doneExams / totalExams) * 100) : null;
	const deliberated = cohorts.reduce((s, c) => s + c.deliberatedCount, 0);
	const admitted = cohorts.reduce((s, c) => s + c.admittedCount, 0);
	const avgSuccessRate = deliberated > 0 ? admitted / deliberated : null;

	return {
		isPending: analyticsQuery.isPending,
		cohorts,
		totalStudents,
		totalPending,
		avgProgress,
		avgSuccessRate,
	};
}
