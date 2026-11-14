import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import type { FeeAssignmentRow } from "../types";

interface AssignmentsFilters {
	academicYearId?: string;
	classId?: string;
	status?: string;
	search?: string;
	feeStructureId?: string;
}

/** First 200 fee assignments matching the filters. */
export function useFeeAssignments({
	academicYearId,
	classId,
	status,
	search,
	feeStructureId,
}: AssignmentsFilters) {
	const query = useQuery(
		trpc.feeClearance.listAssignments.queryOptions({
			...(feeStructureId !== undefined
				? { feeStructureId }
				: {
						academicYearId: academicYearId || undefined,
						classId: classId || undefined,
						status: status ? [status] : undefined,
						search: search || undefined,
					}),
			limit: 200,
			offset: 0,
		}),
	);
	return { ...query, assignments: query.data?.items ?? [] };
}

export function useRefreshAssignments() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listAssignments.queryKey(),
		});
}

/** Number of assignments per status in the current result set. */
export const countByStatus = (items: FeeAssignmentRow[]) =>
	items.reduce(
		(acc, a) => {
			acc[a.status] = (acc[a.status] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
