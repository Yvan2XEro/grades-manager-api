import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { PeopleFilters } from "../types";

/** Paged people list; class/year filters only apply to students. */
export function usePeople({
	page,
	pageSize,
	filters,
}: {
	page: number;
	pageSize: number;
	filters: PeopleFilters;
}) {
	const debouncedSearch = useDebounce(filters.search, 300);
	const isStudent = filters.role === "student";

	const queryParams = {
		page,
		pageSize,
		role: filters.role === "all" ? undefined : filters.role,
		status: filters.status === "all" ? undefined : filters.status,
		search: debouncedSearch || undefined,
		classId: isStudent ? (filters.classId ?? undefined) : undefined,
		academicYearId: isStudent
			? (filters.academicYearId ?? undefined)
			: undefined,
	};

	const { data, isLoading } = useQuery(
		trpc.users.listPaged.queryOptions(queryParams),
	);

	return { data, people: data?.items ?? [], isLoading };
}

export function useDeleteProfile() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trpcClient.users.deleteProfile.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted", { defaultValue: "Deleted" }));
			// Invalidate all listPaged variants so any cached pages refresh
			queryClient.invalidateQueries({
				queryKey: trpc.users.listPaged.queryKey(),
			});
		},
		onError: (err: Error) => toast.error(err.message),
	});
}
