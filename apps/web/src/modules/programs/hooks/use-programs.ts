import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ProgramListItem, ProgramRow } from "../types";

export const toProgramRow = (p: ProgramListItem): ProgramRow => {
	const item = p as any;
	return {
		id: p.id,
		code: p.code,
		name: p.name,
		nameEn: item.nameEn ?? null,
		abbreviation: item.abbreviation ?? null,
		description: p.description ?? null,
		domainFr: item.domainFr ?? null,
		domainEn: item.domainEn ?? null,
		specialiteFr: item.specialiteFr ?? null,
		specialiteEn: item.specialiteEn ?? null,
		diplomaTitleFr: item.diplomaTitleFr ?? null,
		diplomaTitleEn: item.diplomaTitleEn ?? null,
		attestationValidityFr: item.attestationValidityFr ?? null,
		attestationValidityEn: item.attestationValidityEn ?? null,
		cycleId: item.cycleId ?? null,
		centerId: item.centerId ?? null,
		isCenterProgram: Boolean(item.isCenterProgram),
		optionsCount: item.optionsCount ?? 0,
	};
};

/** Programs matching the search, mapped to table rows. */
export function usePrograms(searchQuery: string) {
	const query = useQuery({
		queryKey: ["programs", searchQuery],
		queryFn: async () => {
			const programRes = await trpcClient.programs.list.query({
				...(searchQuery ? { q: searchQuery } : {}),
				limit: 200,
			});
			return programRes.items.map(toProgramRow);
		},
	});
	return { ...query, programs: query.data ?? [] };
}

/** Deletes one or several programs and refreshes the lists. */
export function useDeletePrograms() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(ids.map((id) => trpcClient.programs.delete.mutate({ id }))),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries({ queryKey: ["programs"] });
			toast.success(
				ids.length === 1
					? t("admin.programs.toast.deleteSuccess")
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) => {
			toast.error(
				ids.length === 1
					? (error as Error).message || t("admin.programs.toast.deleteError")
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			);
		},
	});
}

/** Every program, for the program selects and name lookups. */
export function useProgramList() {
	const { data } = useQuery(trpc.programs.list.queryOptions({}));
	return data?.items ?? [];
}
