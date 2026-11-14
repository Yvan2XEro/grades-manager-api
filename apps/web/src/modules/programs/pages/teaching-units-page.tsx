import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useProgramList } from "../hooks/use-programs";
import {
	useDeleteTeachingUnits,
	useTeachingUnits,
} from "../hooks/use-teaching-units";
import { getTeachingUnitsColumns } from "../table/teaching-units-columns";
import type { TeachingUnitRow } from "../types";

export default function TeachingUnitsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedProgramId, setSelectedProgramId] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const programList = useProgramList();
	const { data, units, isLoading } = useTeachingUnits({
		page,
		pageSize,
		programId: selectedProgramId,
	});
	const selection = useRowSelection(units);
	const deleteUnits = useDeleteTeachingUnits();

	const columns = useMemo(
		() =>
			getTeachingUnitsColumns(
				t,
				new Map(programList.map((program) => [program.id, program.name])),
			),
		[t, programList],
	);

	const changeProgram = (programId: string) => {
		setSelectedProgramId(programId);
		setPage(1);
	};

	const openCreate = () => navigate("/programs/teaching-units/new");
	const openDetail = (unit: TeachingUnitRow) =>
		navigate(`/programs/teaching-units/${unit.id}/details`);

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.teachingUnits.deleteTitle", {
				defaultValue: "Delete teaching unit",
			}),
			message: t("admin.teachingUnits.deleteMessage", {
				defaultValue: "Are you sure you want to remove this unit?",
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteUnits.mutateAsync([id]).catch(() => undefined),
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
				deleteUnits.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (unit: TeachingUnitRow): RowAction[] => [
		{
			label: t("common.actions.open", { defaultValue: "Open" }),
			icon: FolderOpen,
			onSelect: () => openDetail(unit),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(unit.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.teachingUnits.list", { defaultValue: "Units list" })}
					description={t("admin.teachingUnits.listDescription", {
						defaultValue: "Browse teaching units and open them to manage ECs.",
					})}
					actions={
						<Button onClick={openCreate}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.teachingUnits.actions.create", {
								defaultValue: "Create UE",
							})}
						</Button>
					}
				/>
			}
			toolbar={
				<>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={selectedProgramId || undefined}
							onValueChange={(v) => changeProgram(v === "all" ? "" : v)}
						>
							<SelectTrigger className="min-w-48">
								<SelectValue
									placeholder={t("admin.teachingUnits.selectProgram", {
										defaultValue: "Select program",
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								{programList.map((program) => (
									<SelectItem key={program.id} value={program.id}>
										{program.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							onClick={() => changeProgram("")}
							disabled={!selectedProgramId}
						>
							{t("common.actions.reset", { defaultValue: "Reset" })}
						</Button>
					</div>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={deleteUnits.isPending}
						>
							<Trash2 className="mr-1.5 h-3.5 w-3.5" />
							{t("common.actions.delete")}
						</Button>
					</BulkActionBar>
				</>
			}
			footer={
				units.length > 0 && (
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
				)
			}
		>
			<DataTable
				columns={columns}
				data={units}
				isLoading={isLoading}
				selection={selection}
				onRowClick={openDetail}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Plus className="h-6 w-6" />}
						title={t("admin.teachingUnits.empty", {
							defaultValue: "No units yet for this program.",
						})}
						description={t("admin.teachingUnits.emptyDescription", {
							defaultValue: "Create a teaching unit to start managing ECs.",
						})}
						cta={{
							label: t("admin.teachingUnits.actions.create", {
								defaultValue: "Create UE",
							}),
							onClick: openCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
