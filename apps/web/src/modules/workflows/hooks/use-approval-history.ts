import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import type { HistoryStatus } from "../types";

/** Filters, page and results of the approval history. */
export function useApprovalHistory() {
	const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");
	const [search, setSearch] = useState("");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");
	const [teacherFilter, setTeacherFilter] = useState<string>("all");
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const withPageReset =
		<T>(setter: (v: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	// Status filter is passed to server: "approved", "rejected", or both
	const serverStatuses =
		statusFilter === "all"
			? (["approved", "rejected"] as const)
			: ([statusFilter] as const);

	const teachersQuery = useQuery(
		trpc.users.list.queryOptions({ roles: ["teacher"] }),
	);

	const { data: historyData, isLoading } = useQuery(
		trpc.exams.listPaged.queryOptions({
			page,
			pageSize,
			statuses: [...serverStatuses],
			query: search.trim() || undefined,
			classId: classFilter !== "all" ? classFilter : undefined,
			academicYearId: yearFilter !== "all" ? yearFilter : undefined,
			teacherId: teacherFilter !== "all" ? teacherFilter : undefined,
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
			dateTo: dateTo ? new Date(dateTo) : undefined,
		}),
	);

	const exams = historyData?.items ?? [];

	return {
		filters: {
			search,
			setSearch: withPageReset(setSearch),
			classFilter,
			setClassFilter: withPageReset(setClassFilter),
			yearFilter,
			setYearFilter: withPageReset(setYearFilter),
		},
		statusFilter,
		setStatusFilter: withPageReset(setStatusFilter),
		teacherFilter,
		setTeacherFilter: withPageReset(setTeacherFilter),
		dateFrom,
		setDateFrom: withPageReset(setDateFrom),
		dateTo,
		setDateTo: withPageReset(setDateTo),
		teachers: teachersQuery.data?.items ?? [],
		page,
		setPage,
		pageSize,
		setPageSize: (s: number) => {
			setPageSize(s);
			setPage(1);
		},
		historyData,
		isLoading,
		exams,
		// KPI counts from current page
		approvedCount: exams.filter((e) => e.status === "approved").length,
		rejectedCount: exams.filter((e) => e.status === "rejected").length,
	};
}
