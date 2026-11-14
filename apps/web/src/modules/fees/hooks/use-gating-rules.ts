import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Actions that can require fee clearance, each enabled or not. */
export function useGatingRules() {
	return useQuery(trpc.feeClearance.listGatingRules.queryOptions());
}

export function useToggleGate() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ gate, isEnabled }: { gate: string; isEnabled: boolean }) =>
			trpcClient.feeClearance.toggleGate.mutate({
				gate: gate as never,
				isEnabled,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.listGatingRules.queryKey(),
			});
			toast.success(t("common.saved"));
		},
	});
}
