import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { CenterRow } from "../types";

/** Every center, active or not. */
export function useCenters() {
	return useQuery({
		queryKey: ["centers"],
		queryFn: async () => {
			const result = await trpcClient.centers.list.query({
				limit: 200,
				includeInactive: true,
			});
			return result.items as CenterRow[];
		},
	});
}

export function useDeleteCenter() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trpcClient.centers.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.centers.toast.deleteSuccess", {
					defaultValue: "Centre supprimé",
				}),
			);
			queryClient.invalidateQueries({ queryKey: ["centers"] });
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
