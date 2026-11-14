import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** One page of guardians with their student links. */
export function useGuardians(input: {
	page: number;
	pageSize: number;
	search?: string;
}) {
	const query = useQuery(trpc.guardians.listAll.queryOptions(input));
	return { ...query, guardians: query.data?.items ?? [] };
}

export function useRefreshGuardians() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: trpc.guardians.listAll.queryKey(),
		});
}

/** Unlinks a guardian from one student. */
export function useRemoveGuardianLink() {
	const { t } = useTranslation();
	const refresh = useRefreshGuardians();
	return useMutation({
		mutationFn: (input: { studentId: string; guardianId: string }) =>
			trpcClient.guardians.removeLink.mutate(input),
		onSuccess: () => {
			toast.success(t("common.done", { defaultValue: "Done" }));
			refresh();
		},
		onError: (err: Error) => toast.error(err.message),
	});
}

export function useDeleteGuardian() {
	const { t } = useTranslation();
	const refresh = useRefreshGuardians();
	return useMutation({
		mutationFn: (id: string) => trpcClient.guardians.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			refresh();
		},
		onError: (err: Error) => toast.error(err.message),
	});
}
