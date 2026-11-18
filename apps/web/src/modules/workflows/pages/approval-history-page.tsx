import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { ApprovalHistoryCard } from "../components/approval-history-card";
import { ApprovalHistoryFilters } from "../components/approval-history-filters";
import { ApprovalHistoryKpis } from "../components/approval-history-kpis";
import { useApprovalHistory } from "../hooks/use-approval-history";

/** Dean: approved and rejected exams with their audit trail. */
export default function ApprovalHistory() {
	const { t } = useTranslation();
	const history = useApprovalHistory();
	const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.history.title")}
				description={t("dean.history.subtitle")}
			/>

			<ApprovalHistoryKpis
				approvedCount={history.approvedCount}
				rejectedCount={history.rejectedCount}
			/>

			<ApprovalHistoryFilters history={history} />

			{history.isLoading ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : history.exams.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<ClipboardCheck className="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground text-sm">
							{t("dean.history.empty")}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							{t("dean.history.emptyHint")}
						</p>
					</div>
				</div>
			) : (
				<>
					<div className="space-y-2">
						{history.exams.map((exam) => (
							<ApprovalHistoryCard
								key={exam.id}
								exam={exam}
								expanded={expandedExamId === exam.id}
								onToggleExpanded={() =>
									setExpandedExamId(expandedExamId === exam.id ? null : exam.id)
								}
							/>
						))}
					</div>

					<TablePagination
						page={history.page}
						pageCount={history.historyData?.pageCount ?? 1}
						total={history.historyData?.total ?? 0}
						pageSize={history.pageSize}
						onPageChange={history.setPage}
						onPageSizeChange={history.setPageSize}
					/>
				</>
			)}
		</div>
	);
}
