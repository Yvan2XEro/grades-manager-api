import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { trpc } from "@/utils/trpc";

export const ALL = "__all__";
export const PAGE_SIZE = 25;

/**
 * Filters (search, status, program, year — the year starts on the active one)
 * and the current page of applications.
 */
export function useApplications() {
	const [searchInput, setSearchInput] = useState("");
	const search = useDebounce(searchInput, 300);
	const [statusFilter, setStatusFilter] = useState(ALL);
	const [programFilter, setProgramFilter] = useState(ALL);
	const [yearFilter, setYearFilter] = useState<string | null>(null);
	const [page, setPage] = useState(0);

	// Initialize year filter to the active academic year on first load
	const yearListQuery = useQuery(trpc.academicYears.list.queryOptions({}));
	const [yearInitialized, setYearInitialized] = useState(false);
	useEffect(() => {
		const active = yearListQuery.data?.items.find((y) => y.isActive)?.id;
		if (!yearInitialized && active) {
			setYearFilter(active);
			setYearInitialized(true);
		}
	}, [yearListQuery.data, yearInitialized]);

	// Reset page when filters change
	useEffect(() => {
		setPage(0);
	}, [search, statusFilter, programFilter, yearFilter]);

	const listQuery = useQuery(
		trpc.admissions.list.queryOptions({
			search: search || undefined,
			status: statusFilter === ALL ? undefined : (statusFilter as never),
			programId: programFilter === ALL ? undefined : programFilter,
			academicYearId: yearFilter ?? undefined,
			limit: PAGE_SIZE,
			offset: page * PAGE_SIZE,
		}),
	);
	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());

	const total = listQuery.data?.total ?? 0;
	const hasFilters = Boolean(
		search ||
			statusFilter !== ALL ||
			programFilter !== ALL ||
			yearFilter !== null,
	);

	const clearFilters = () => {
		setSearchInput("");
		setStatusFilter(ALL);
		setProgramFilter(ALL);
		setYearFilter(null);
	};

	return {
		filters: {
			searchInput,
			setSearchInput,
			statusFilter,
			setStatusFilter,
			programFilter,
			setProgramFilter,
			yearFilter,
			setYearFilter,
			hasFilters,
			clearFilters,
		},
		programs: optionsQuery.data?.programs ?? [],
		rows: listQuery.data?.rows ?? [],
		total,
		isLoading: listQuery.isLoading,
		page,
		setPage,
		pageCount: Math.ceil(total / PAGE_SIZE),
	};
}

export type ApplicationsFilters = ReturnType<typeof useApplications>["filters"];
