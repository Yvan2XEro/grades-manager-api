import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export const promotionRulesKey = ["promotionRules"];

/** All promotion rules (shared by the overview and the rules tab). */
export function usePromotionRules() {
	return useQuery({
		queryKey: promotionRulesKey,
		queryFn: async () => trpcClient.promotionRules.list.query({}),
	});
}

export function useRefreshPromotionRules() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: promotionRulesKey });
}

/** Toggles a rule active/inactive and deletes rules. */
export function usePromotionRuleMutations() {
	const { t } = useTranslation();
	const refresh = useRefreshPromotionRules();

	const update = useMutation({
		mutationFn: async (data: {
			id: string;
			name?: string;
			description?: string;
			ruleset?: Record<string, unknown>;
			isActive?: boolean;
		}) => trpcClient.promotionRules.update.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.updateSuccess"));
			refresh();
		},
		onError: (error: Error) => {
			toast.error(
				t("admin.promotionRules.rulesList.toast.updateError", {
					error: error.message,
				}),
			);
		},
	});

	const remove = useMutation({
		mutationFn: async (data: { id: string }) =>
			trpcClient.promotionRules.delete.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.deleteSuccess"));
			refresh();
		},
		onError: (error: Error) => {
			toast.error(
				t("admin.promotionRules.rulesList.toast.deleteError", {
					error: error.message,
				}),
			);
		},
	});

	return { update, remove };
}
