import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/** Cohort analytics of the dean and the totals shown in the KPI row. */
export function useCohortAnalytics() {
	const analyticsQuery = useQuery(
		trpc.workflows.cohortAnalytics.queryOptions({}),
	);
	const cohorts = analyticsQuery.data ?? [];

	const totalStudents = cohorts.reduce((s, c) => s + c.totalStudents, 0);
	const totalPending = cohorts.reduce((s, c) => s + c.submittedExams, 0);
	const avgProgress =
		cohorts.length > 0
			? Math.round(
					cohorts.reduce((s, c) => s + c.gradingProgress, 0) / cohorts.length,
				)
			: 0;
	const cohortsWithResults = cohorts.filter((c) => c.successRate !== null);
	const avgSuccessRate =
		cohortsWithResults.length > 0
			? Math.round(
					cohortsWithResults.reduce((s, c) => s + (c.successRate ?? 0), 0) /
						cohortsWithResults.length,
				)
			: null;

	return {
		isPending: analyticsQuery.isPending,
		cohorts,
		totalStudents,
		totalPending,
		avgProgress,
		avgSuccessRate,
	};
}
