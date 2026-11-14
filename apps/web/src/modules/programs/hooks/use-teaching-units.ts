import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

interface TeachingUnitsFilters {
	page: number;
	pageSize: number;
	programId: string;
}

/** One page of teaching units (UE). */
export function useTeachingUnits({
	page,
	pageSize,
	programId,
}: TeachingUnitsFilters) {
	const query = useQuery(
		trpc.teachingUnits.listPaged.queryOptions({
			page,
			pageSize,
			programId: programId || undefined,
		}),
	);
	return { ...query, units: query.data?.items ?? [] };
}

/** Deletes one or several teaching units and refreshes the list. */
export function useDeleteTeachingUnits() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.teachingUnits.delete.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries(trpc.teachingUnits.listPaged.queryKey());
			toast.success(
				ids.length === 1
					? t("admin.teachingUnits.toast.deleted", {
							defaultValue: "Teaching unit deleted",
						})
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? (error as Error).message
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			),
	});
}
