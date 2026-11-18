import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Fee structures, optionally restricted to one academic year. */
export function useFeeStructures(academicYearId: string) {
	return useQuery(
		trpc.feeClearance.listStructures.queryOptions({
			academicYearId: academicYearId || undefined,
		}),
	);
}

export function useRefreshStructures() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listStructures.queryKey(),
		});
}

export function useDeleteStructure() {
	const { t } = useTranslation();
	const refresh = useRefreshStructures();
	return useMutation({
		mutationFn: (id: string) =>
			trpcClient.feeClearance.deleteStructure.mutate({ id }),
		onSuccess: () => {
			refresh();
			toast.success(t("common.deleted"));
		},
	});
}

/** One fee structure (with its installments) and a refresh helper. */
export function useFeeStructure(id: string) {
	const queryClient = useQueryClient();
	const query = useQuery(trpc.feeClearance.getStructure.queryOptions({ id }));
	const refresh = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.getStructure.queryKey({ id }),
		});
	return { ...query, structure: query.data, refresh };
}

type StructurePatch = {
	name?: string;
	description?: string;
	totalAmount?: number;
	isActive?: boolean;
};

/** Patches a fee structure; `onSaved` runs after the refresh and the toast. */
export function useUpdateStructure(id: string, onSaved?: () => void) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (patch: StructurePatch) =>
			trpcClient.feeClearance.updateStructure.mutate({ id, ...patch }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.getStructure.queryKey({ id }),
			});
			toast.success(t("common.saved"));
			onSaved?.();
		},
	});
}

export function useDeleteInstallment(onDeleted: () => void) {
	return useMutation({
		mutationFn: (installmentId: string) =>
			trpcClient.feeClearance.deleteInstallment.mutate({ id: installmentId }),
		onSuccess: onDeleted,
	});
}
