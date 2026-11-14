import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ClassSelect } from "@/components/inputs/ClassSelect";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/ui/table-pagination";
import type { useWorkflowApprovals } from "../hooks/use-workflow-approvals";
import { WorkflowExamRow } from "./workflow-exam-row";

type Workflow = ReturnType<typeof useWorkflowApprovals>;

/** Submitted exams panel: filters, bulk approval, rows and pagination. */
export function WorkflowExamQueue({ workflow }: { workflow: Workflow }) {
	const { t } = useTranslation();
	const { filters, pendingExams, selection, examsQuery, confirmApproval } =
		workflow;

	return (
		<div className="rounded-xl border-0 bg-card p-6 shadow-sm">
			<h2 className="font-heading font-semibold text-foreground text-lg">
				{t("dean.workflows.queue", { defaultValue: "Submitted exams" })}
			</h2>

			{/* Filters */}
			<div className="mt-3 flex flex-wrap items-center gap-2">
				<AcademicYearSelect
					value={filters.yearFilter}
					onChange={filters.onYearChange}
					className="w-[160px]"
				/>
				<ClassSelect
					academicYearId={filters.yearFilter}
					value={filters.classFilter}
					onChange={filters.onClassChange}
				/>
				<input
					type="date"
					value={filters.dateFrom}
					onChange={(e) => filters.onDateFromChange(e.target.value)}
					className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
					title={t("dean.workflows.dateFrom", {
						defaultValue: "Submitted from",
					})}
				/>
			</div>

			<BulkActionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
			>
				<Button
					size="sm"
					onClick={() =>
						confirmApproval({
							kind: "bulk",
							examIds: [...selection.selectedIds],
						})
					}
					disabled={
						workflow.bulkValidateMutation.isPending ||
						selection.selectedCount === 0
					}
				>
					<ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
					{t("dean.workflows.actions.bulkValidate", {
						defaultValue: "Approve all selected",
					})}
				</Button>
			</BulkActionBar>

			<div className="mt-4 space-y-3">
				{pendingExams.length ? (
					<>
						<div className="flex items-center gap-2 px-1">
							<Checkbox
								checked={selection.isAllSelected}
								onCheckedChange={(checked) =>
									selection.toggleAll(Boolean(checked))
								}
								aria-label="Select all exams"
							/>
							<span className="text-muted-foreground text-xs">
								{t("common.bulkActions.selectAll", {
									defaultValue: "Select all",
								})}
							</span>
						</div>
						{pendingExams.map((exam) => (
							<WorkflowExamRow
								key={exam.id}
								exam={exam}
								selected={selection.isSelected(exam.id)}
								onToggle={() => selection.toggle(exam.id)}
								onReject={() => workflow.openReject(exam)}
								onApprove={() =>
									confirmApproval({
										kind: "single",
										examId: exam.id,
										examName: exam.name,
									})
								}
								isApproving={workflow.validateExam.isPending}
							/>
						))}
					</>
				) : (
					<p className="text-muted-foreground text-xs">
						{t("dean.workflows.empty", {
							defaultValue: "No pending exams.",
						})}
					</p>
				)}
			</div>
			<TablePagination
				page={workflow.examPage}
				pageCount={examsQuery.data?.pageCount ?? 1}
				total={examsQuery.data?.total ?? 0}
				pageSize={workflow.examPageSize}
				onPageChange={workflow.setExamPage}
				onPageSizeChange={workflow.setExamPageSize}
			/>
		</div>
	);
}
