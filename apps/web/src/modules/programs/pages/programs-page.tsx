import { Copy, Pencil, Plus, School, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Confirm, confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useRowSelection } from "@/hooks/useRowSelection";
import { DuplicateProgramsDialog } from "../components/duplicate-programs-dialog";
import { ProgramFormDialog } from "../components/program-form-dialog";
import { useDeletePrograms, usePrograms } from "../hooks/use-programs";
import { useStudyCycles } from "../hooks/use-study-cycles";
import { getProgramsColumns } from "../table/programs-columns";
import type { ProgramRow } from "../types";

export default function ProgramsPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState("");

	const { data: cycles } = useStudyCycles();
	const { programs, isLoading } = usePrograms(searchQuery);
	const selection = useRowSelection(programs);
	const deletePrograms = useDeletePrograms();

	const columns = useMemo(
		() =>
			getProgramsColumns(
				t,
				new Map((cycles?.items ?? []).map((c) => [c.id, c.name])),
			),
		[t, cycles],
	);

	const startCreate = async () => {
		const program = await ProgramFormDialog.call({});
		if (program?.id) navigate(`/programs/${program.id}/details`);
	};

	const startDuplicate = async () => {
		const result = await DuplicateProgramsDialog.call({
			sourceProgramIds: [...selection.selectedIds],
		});
		if (result) selection.clear();
	};

	const openDetail = (program: ProgramRow) =>
		navigate(`/programs/${program.id}/details`);

	const confirmDelete = (id: string) =>
		Confirm.call({
			title: t("admin.programs.delete.title"),
			description: t("admin.programs.delete.message"),
			confirmLabel: t("common.actions.delete"),
			mutationFn: async (call) => {
				try {
					await deletePrograms.mutateAsync([id]);
					call.end(true);
				} catch {
					// toast already shown by the mutation
				}
			},
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
				deletePrograms.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (program: ProgramRow): RowAction[] => [
		{
			label: t("common.actions.edit"),
			icon: Pencil,
			onSelect: () => openDetail(program),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(program.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.programs.title")}
					description={t("admin.programs.subtitle")}
					actions={
						<Button onClick={startCreate}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.programs.actions.add")}
						</Button>
					}
				/>
			}
			toolbar={
				<>
					<div className="relative w-full max-w-sm">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("admin.programs.search", {
								defaultValue: "Search programs...",
							})}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button variant="outline" size="sm" onClick={startDuplicate}>
							<Copy className="mr-1 h-3.5 w-3.5" />
							{t("admin.programs.duplicate.button", {
								defaultValue: "Dupliquer vers cycle…",
							})}
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={deletePrograms.isPending}
						>
							<Trash2 className="mr-1 h-3.5 w-3.5" />
							{t("common.actions.delete")}
						</Button>
					</BulkActionBar>
				</>
			}
		>
			<DataTable
				columns={columns}
				data={programs}
				isLoading={isLoading}
				selection={selection}
				onRowClick={openDetail}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<School className="h-6 w-6" />}
						title={t("admin.programs.empty.title")}
						description={t("admin.programs.empty.description")}
						cta={{
							label: t("admin.programs.actions.add"),
							onClick: startCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
