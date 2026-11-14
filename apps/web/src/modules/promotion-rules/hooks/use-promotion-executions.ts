import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

/** The 5 latest executions, for the overview. */
export function useRecentPromotionExecutions() {
	return useQuery({
		queryKey: ["promotionExecutions", { limit: 5 }],
		queryFn: async () =>
			trpcClient.promotionRules.listExecutions.query({ limit: 5 }),
	});
}

/** Executions, optionally of one academic year. */
export function usePromotionExecutions(academicYearId: string | null) {
	return useQuery({
		queryKey: ["promotionExecutions", academicYearId],
		queryFn: async () =>
			trpcClient.promotionRules.listExecutions.query({
				...(academicYearId ? { academicYearId } : {}),
			}),
	});
}

export function usePromotionExecutionDetails(executionId: string) {
	return useQuery({
		queryKey: ["promotionExecutionDetails", executionId],
		queryFn: async () =>
			trpcClient.promotionRules.getExecutionDetails.query({ executionId }),
	});
}
