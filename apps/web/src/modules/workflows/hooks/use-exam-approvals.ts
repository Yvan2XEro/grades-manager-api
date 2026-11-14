import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ExamItem } from "../types";

/** Filters, page and selection of the submitted exams awaiting approval. */
export function useExamApprovals() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [classFilter, setClassFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const withPageReset =
		<T>(setter: (v: T) => void) =>
		(v: T) => {
			setter(v);
			setPage(1);
		};

	const examsQuery = useQuery(
		trpc.exams.listPaged.queryOptions({
			page,
			pageSize,
			statuses: ["submitted"],
			query: search.trim() || undefined,
			classId: classFilter !== "all" ? classFilter : undefined,
			academicYearId: yearFilter !== "all" ? yearFilter : undefined,
		}),
	);

	// Server already filters status: "submitted" — no client-side re-filter needed
	const exams = (examsQuery.data?.items ?? []) as ExamItem[];
	const selection = useRowSelection(exams);

	const bulkApproveMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((examId) =>
					trpcClient.workflows.validateGrades.mutate({
						examId,
						approverId: undefined,
					}),
				),
			);
		},
		onSuccess: () => {
			toast.success(t("dean.approvals.bulkApproved"));
			queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
			selection.clear();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const invalidateAndReset = () => {
		queryClient.invalidateQueries(trpc.exams.listPaged.queryKey());
		selection.clear();
	};

	return {
		filters: {
			search,
			setSearch: withPageReset(setSearch),
			classFilter,
			setClassFilter: withPageReset(setClassFilter),
			yearFilter,
			setYearFilter: withPageReset(setYearFilter),
		},
		page,
		setPage,
		pageSize,
		setPageSize: (s: number) => {
			setPageSize(s);
			setPage(1);
		},
		examsQuery,
		exams,
		selection,
		bulkApproveMutation,
		invalidateAndReset,
	};
}
