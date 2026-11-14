import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { ExamApprovalCard } from "../components/exam-approval-card";
import { ExamApprovalsSelectBar } from "../components/exam-approvals-select-bar";
import { ExamFilters } from "../components/exam-filters";
import { useExamApprovals } from "../hooks/use-exam-approvals";

/** Dean: submitted exams awaiting approval. */
export default function ExamApprovals() {
	const { t } = useTranslation();
	const {
		filters,
		page,
		setPage,
		pageSize,
		setPageSize,
		examsQuery,
		exams,
		selection,
		bulkApproveMutation,
		invalidateAndReset,
	} = useExamApprovals();

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.approvals.title")}
				description={
					exams.length > 0
						? t("dean.approvals.pendingCount", { count: exams.length })
						: t("dean.approvals.noPending")
				}
			/>

			<ExamFilters {...filters} />

			{examsQuery.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : exams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
						<ClipboardCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							{t("dean.approvals.allDone")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("dean.approvals.noPending")}
						</p>
					</div>
				</div>
			) : (
				<>
					<ExamApprovalsSelectBar
						allSelected={selection.isAllSelected}
						selectedCount={selection.selectedCount}
						onToggleAll={selection.toggleAll}
						onApprove={() =>
							bulkApproveMutation.mutate([...selection.selectedIds])
						}
						isApproving={bulkApproveMutation.isPending}
					/>

					<div className="space-y-3">
						{exams.map((exam) => (
							<ExamApprovalCard
								key={exam.id}
								exam={exam}
								selected={selection.isSelected(exam.id)}
								onToggle={() => selection.toggle(exam.id)}
								onApproved={invalidateAndReset}
							/>
						))}
					</div>

					<TablePagination
						page={page}
						pageCount={examsQuery.data?.pageCount ?? 1}
						total={examsQuery.data?.total ?? 0}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={setPageSize}
					/>
				</>
			)}
		</div>
	);
}
