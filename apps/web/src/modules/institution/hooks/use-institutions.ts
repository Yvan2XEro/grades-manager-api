import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Deletes one or several institutions and refreshes the list. */
export function useDeleteInstitutions() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.institutions.delete.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries({
				queryKey: trpc.institutions.list.queryKey(),
			});
			toast.success(
				ids.length === 1
					? t("admin.institutions.toast.deleteSuccess", {
							defaultValue: "Institution deleted",
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
