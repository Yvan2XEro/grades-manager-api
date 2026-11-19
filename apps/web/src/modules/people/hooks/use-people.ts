import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { PeopleAudience, PeopleFilters } from "../types";

/** Paged people list; class/year/enrollment filters only apply to students. */
export function usePeople({
	page,
	pageSize,
	audience,
	filters,
}: {
	page: number;
	pageSize: number;
	audience: PeopleAudience;
	filters: PeopleFilters;
}) {
	const debouncedSearch = useDebounce(filters.search, 300);
	const isStudent = audience === "students";
	// A name or registration-number search looks at every student, whatever
	// the year, class and status: a promoted (completed) or former student is
	// found instead of looking lost.
	const scoped = isStudent && !debouncedSearch.trim();

	const queryParams = {
		page,
		pageSize,
		audience,
		role: isStudent || filters.role === "all" ? undefined : filters.role,
		status: filters.status === "all" ? undefined : filters.status,
		search: debouncedSearch || undefined,
		classId: scoped ? (filters.classId ?? undefined) : undefined,
		academicYearId: scoped ? (filters.academicYearId ?? undefined) : undefined,
		enrollmentStatus:
			scoped && filters.enrollmentStatus !== "all"
				? filters.enrollmentStatus
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
			toast.success(t("common.deleted"));
			// Invalidate all listPaged variants so any cached pages refresh
			queryClient.invalidateQueries({
				queryKey: trpc.users.listPaged.queryKey(),
			});
		},
		onError: (err: Error) => toast.error(err.message),
	});
}
