import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { DeliberationType } from "../services/deliberation-status";

interface DeliberationsFilters {
	page: number;
	pageSize: number;
	academicYearId: string | null;
	status: string;
	type: string;
}

/** One page of deliberations; `"all"` disables the status/type filters. */
export function useDeliberations({
	page,
	pageSize,
	academicYearId,
	status,
	type,
}: DeliberationsFilters) {
	const query = useQuery(
		trpc.deliberations.listPaged.queryOptions({
			page,
			pageSize,
			academicYearId: academicYearId || undefined,
			status: status !== "all" ? status : undefined,
			type: type !== "all" ? (type as DeliberationType) : undefined,
		}),
	);
	return { ...query, deliberations: query.data?.items ?? [] };
}

export function useDeleteDeliberation() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trpcClient.deliberations.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.deleteSuccess"));
			queryClient.invalidateQueries({
				queryKey: trpc.deliberations.listPaged.queryKey(),
			});
		},
		onError: (err) => toast.error((err as Error).message),
	});
}
