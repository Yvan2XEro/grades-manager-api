import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
	EmptyTitle,
} from "@/components/ui/empty";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { ExamTypeFormDialog } from "../components/exam-type-form-dialog";
import { useDeleteExamTypes, useExamTypes } from "../hooks/use-exam-types";
import { getExamTypesColumns } from "../table/exam-types-columns";
import type { ExamTypeRow } from "../types";

export default function ExamTypesPage() {
	const { t } = useTranslation();
	const { data, examTypes, isLoading, page, setPage, pageSize, setPageSize } =
		useExamTypes();
	const selection = useRowSelection(examTypes);
	const { deleteExamType, bulkDelete } = useDeleteExamTypes(selection.clear);
	const columns = useMemo(() => getExamTypesColumns(t), [t]);

	const openCreate = () => ExamTypeFormDialog.call({});
	const openEdit = (examType: ExamTypeRow) =>
		ExamTypeFormDialog.call({ examType });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.examTypes.delete.title"),
			message: t("admin.examTypes.delete.message"),
			onConfirm: () => deleteExamType.mutateAsync(id).catch(() => undefined),
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

	const rowActions = (type: ExamTypeRow): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openEdit(type),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(type.id),
		},
	];

	return (
		<ListLayout
			header={
				<div className="flex justify-end">
					<Button onClick={openCreate}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.examTypes.actions.add")}
					</Button>
				</div>
			}
			toolbar={
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
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						{t("common.actions.delete")}
					</Button>
				</BulkActionBar>
			}
			footer={
				examTypes.length > 0 && (
					<TablePagination
						page={page}
						pageCount={data?.pageCount ?? 1}
						total={data?.total ?? 0}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={setPageSize}
					/>
				)
			}
		>
			<DataTable
				columns={columns}
				data={examTypes}
				isLoading={isLoading}
				selection={selection}
				rowActions={rowActions}
				empty={
					<Empty>
						<EmptyHeader>
							<EmptyTitle>{t("admin.examTypes.title")}</EmptyTitle>
							<EmptyDescription>{t("admin.examTypes.empty")}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent />
					</Empty>
				}
			/>
		</ListLayout>
	);
}
