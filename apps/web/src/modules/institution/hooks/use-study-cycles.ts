import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** One page of study cycles. */
export function useStudyCycles(page: number, pageSize: number) {
	const query = useQuery(
		trpc.studyCycles.listPaged.queryOptions({ page, pageSize }),
	);
	return { ...query, cycles: query.data?.items ?? [] };
}

/** Deletes one or several study cycles and refreshes the list. */
export function useDeleteStudyCycles() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.studyCycles.deleteCycle.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries(trpc.studyCycles.listPaged.queryKey());
			toast.success(
				ids.length === 1
					? t("admin.studyCycles.toast.deleteSuccess", {
							defaultValue: "Study cycle deleted",
						})
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? error.message
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			),
	});
}

/** One study cycle (header and details tab of the detail page). */
export function useStudyCycle(cycleId: string) {
	return useQuery(trpc.studyCycles.getCycle.queryOptions({ id: cycleId }));
}

/** Query key of the levels of a cycle (also invalidated by the level dialog). */
export const cycleLevelsKey = (cycleId?: string) => ["cycleLevels", cycleId];

/** The levels of a cycle. */
export function useCycleLevels(cycleId: string | undefined) {
	return useQuery({
		queryKey: cycleLevelsKey(cycleId),
		queryFn: () =>
			trpcClient.studyCycles.listLevels.query({ cycleId: cycleId! }),
		enabled: Boolean(cycleId),
	});
}

/** Removes a level of a cycle. */
export function useDeleteCycleLevel(cycleId: string | undefined) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			trpcClient.studyCycles.deleteLevel.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.studyCycles.toast.levelDelete", {
					defaultValue: "Level removed",
				}),
			);
			queryClient.invalidateQueries({ queryKey: cycleLevelsKey(cycleId) });
		},
		onError: (err: Error) => toast.error(err.message),
	});
}
