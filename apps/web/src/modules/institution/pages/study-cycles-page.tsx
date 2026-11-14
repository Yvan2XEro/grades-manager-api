import { Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { StudyCycleFormDialog } from "../components/study-cycle-form-dialog";
import {
	useDeleteStudyCycles,
	useStudyCycles,
} from "../hooks/use-study-cycles";
import { getStudyCyclesColumns } from "../table/study-cycles-columns";
import type { StudyCycleRow } from "../types";

export default function StudyCyclesPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, cycles, isLoading } = useStudyCycles(page, pageSize);
	const selection = useRowSelection(cycles);
	const deleteCycles = useDeleteStudyCycles();
	const columns = useMemo(() => getStudyCyclesColumns(t), [t]);

	const openLevels = (cycle: StudyCycleRow) =>
		navigate(`/institution/cycles/${cycle.id}/levels`);
	const editCycle = (cycle: StudyCycleRow) =>
		StudyCycleFormDialog.call({ cycle });

	const confirmDelete = (cycle: StudyCycleRow) =>
		confirmAction({
			title: t("admin.studyCycles.delete.title", {
				defaultValue: "Delete study cycle",
			}),
			message: t("admin.studyCycles.delete.message", {
				defaultValue:
					"Deleting a cycle does not remove existing classes or programs, but they will require reassignment.",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteCycles.mutateAsync([cycle.id]),
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
			onConfirm: () =>
				deleteCycles.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (cycle: StudyCycleRow): RowAction[] => [
		{
			label: t("admin.studyCycles.actions.manageLevels", {
				defaultValue: "Manage levels",
			}),
			icon: Layers3,
			onSelect: () => openLevels(cycle),
		},
		{
			label: t("common.actions.edit"),
			icon: Pencil,
			onSelect: () => editCycle(cycle),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(cycle),
		},
	];

	const addCycle = () => StudyCycleFormDialog.call({});

	return (
		<ListLayout
			header={
				<div className="flex justify-end">
					<Button type="button" onClick={addCycle}>
						<Plus className="mr-2 h-4 w-4" />
						{t("admin.studyCycles.actions.add", { defaultValue: "Add cycle" })}
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
						disabled={deleteCycles.isPending}
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						{t("common.actions.delete")}
					</Button>
				</BulkActionBar>
			}
			footer={
				<TablePagination
					page={page}
					pageCount={data?.pageCount ?? 1}
					total={data?.total ?? 0}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={cycles}
				isLoading={isLoading}
				selection={selection}
				onRowClick={openLevels}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Layers3 className="h-6 w-6" />}
						title={t("admin.studyCycles.empty", {
							defaultValue: "No study cycles yet.",
						})}
					/>
				}
			/>
		</ListLayout>
	);
}
