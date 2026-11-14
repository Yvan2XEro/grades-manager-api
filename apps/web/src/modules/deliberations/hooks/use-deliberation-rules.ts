import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export const deliberationRulesKey = ["deliberation-rules"];

export function useDeliberationRules() {
	const query = useQuery({
		queryKey: deliberationRulesKey,
		queryFn: () =>
			trpcClient.deliberations.rules.list.query({
				limit: 200,
				offset: 0,
			}),
	});
	return { ...query, rules: query.data?.items ?? [] };
}

/** Toggles a rule active/inactive and deletes rules. */
export function useDeliberationRuleMutations() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: deliberationRulesKey });

	const setActive = useMutation({
		mutationFn: (data: { id: string; isActive: boolean }) =>
			trpcClient.deliberations.rules.update.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.deliberations.rules.toast.updateSuccess"));
			refresh();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const remove = useMutation({
		mutationFn: (id: string) =>
			trpcClient.deliberations.rules.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.rules.toast.deleteSuccess"));
			refresh();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	return { setActive, remove };
}
