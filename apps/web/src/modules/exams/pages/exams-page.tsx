import {
	Check,
	ClipboardList,
	Pencil,
	Plus,
	RefreshCw,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { ExamFilters } from "../components/exam-filters";
import { ExamFormDialog } from "../components/exam-form-dialog";
import { RejectExamDialog } from "../components/reject-exam-dialog";
import { RetakeExamDialog } from "../components/retake-exam-dialog";
import {
	canCreateRetake,
	useExamFilters,
	useExamMutations,
	useExams,
} from "../hooks/use-exams";
import { getExamsColumns } from "../table/exams-columns";
import type { ExamRow } from "../types";

export default function ExamsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const examFilters = useExamFilters();
	const { filters, page, pageSize } = examFilters;
	const { data, exams, isLoading, resolveLabels } = useExams({
		filters,
		page,
		pageSize,
		yearsLoading: examFilters.yearsLoading,
	});
	const selection = useRowSelection(exams);
	const { deleteExam, bulkDelete, submitExam, validateExam } = useExamMutations(
		selection.clear,
	);
	const columns = useMemo(
		() => getExamsColumns(t, resolveLabels),
		[t, resolveLabels],
	);

	const openExamForm = (exam?: ExamRow) => ExamFormDialog.call({ exam });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.exams.delete.title"),
			message: t("admin.exams.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteExam.mutateAsync(id).catch(() => undefined),
		});

	const confirmBulkDelete = () =>
		confirmAction({
			title: t("common.bulkActions.confirmDeleteTitle", {
				defaultValue: "Delete selected items?",
			}),
			message: t("common.bulkActions.confirmDelete", {
				defaultValue: "Are you sure you want to delete the selected items?",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => bulkDelete.mutate([...selection.selectedIds]),
		});

	const rowActions = (exam: ExamRow): RowAction[] => {
		const isDraft = exam.status === "draft" || exam.status === "scheduled";
		const isSubmitted = exam.status === "submitted";
		const actions: (RowAction | false)[] = [
			{
				label: t("admin.exams.actions.reviewGrades"),
				icon: ClipboardList,
				onSelect: () =>
					navigate(`/grades/${exam.classCourse}?examId=${exam.id}`),
			},
			{
				label: t("common.actions.edit"),
				icon: Pencil,
				disabled: exam.isLocked,
				onSelect: () => openExamForm(exam),
			},
			isDraft && {
				label: t("admin.exams.actions.submit"),
				icon: Send,
				separator: true,
				disabled: submitExam.isPending,
				onSelect: () => submitExam.mutate(exam.id),
			},
			isSubmitted && {
				label: t("admin.exams.actions.approve"),
				icon: Check,
				separator: true,
				disabled: validateExam.isPending,
				onSelect: () =>
					validateExam.mutate({ examId: exam.id, status: "approved" }),
			},
			isSubmitted && {
				label: t("admin.exams.actions.reject"),
				icon: X,
				destructive: true,
				disabled: validateExam.isPending,
				onSelect: () => RejectExamDialog.call({ examId: exam.id }),
			},
			canCreateRetake(exam, exams) && {
				label: t("retakes.actions.createRetake"),
				icon: RefreshCw,
				separator: !isDraft && !isSubmitted,
				onSelect: () => RetakeExamDialog.call({ parentExam: exam }),
			},
			{
				label: t("common.actions.delete"),
				icon: Trash2,
				destructive: true,
				separator: true,
				disabled: exam.isLocked,
				onSelect: () => confirmDelete(exam.id),
			},
		];
		return actions.filter((action): action is RowAction => Boolean(action));
	};

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.exams.title")}
					description={t("admin.exams.subtitle")}
					actions={
						<Button
							onClick={() => openExamForm()}
							data-testid="add-exam-button"
						>
							<Plus className="mr-2 h-5 w-5" />
							{t("admin.exams.actions.add")}
						</Button>
					}
				/>
			}
			toolbar={
				<>
					<ExamFilters
						filters={filters}
						setFilter={examFilters.setFilter}
						onReset={examFilters.reset}
						isLoading={isLoading}
					/>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={bulkDelete.isPending}
						>
							<Trash2 className="mr-1 h-3.5 w-3.5" />
							{t("common.actions.delete")}
						</Button>
					</BulkActionBar>
				</>
			}
			footer={
				exams.length > 0 && (
					<TablePagination
						page={page}
						pageCount={data?.pageCount ?? 1}
						total={data?.total ?? 0}
						pageSize={pageSize}
						onPageChange={examFilters.setPage}
						onPageSizeChange={examFilters.setPageSize}
					/>
				)
			}
		>
			<DataTable
				columns={columns}
				data={exams}
				isLoading={isLoading}
				selection={selection}
				rowActions={rowActions}
				empty={
					<Empty className="m-4 border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<ClipboardList className="h-8 w-8 text-muted-foreground" />
							</EmptyMedia>
							<EmptyTitle>{t("admin.exams.empty.title")}</EmptyTitle>
							<EmptyDescription>
								{t("admin.exams.empty.description")}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button
								onClick={() => openExamForm()}
								data-testid="add-exam-button-empty"
							>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.exams.actions.add")}
							</Button>
						</EmptyContent>
					</Empty>
				}
			/>
		</ListLayout>
	);
}
