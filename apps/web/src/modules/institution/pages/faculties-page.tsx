import { useQuery } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useRowSelection } from "@/hooks/useRowSelection";
import { trpc } from "@/utils/trpc";
import { InstitutionFormDialog } from "../components/institution-form-dialog";
import { useDeleteInstitutions } from "../hooks/use-institutions";
import { getInstitutionsColumns } from "../table/institutions-columns";
import type { Institution } from "../types";

export default function FacultiesPage() {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(trpc.institutions.list.queryOptions());
	const institutions = useMemo(() => (data ?? []) as Institution[], [data]);
	const selection = useRowSelection(institutions);
	const deleteInstitutions = useDeleteInstitutions();
	const columns = useMemo(() => getInstitutionsColumns(t), [t]);

	const openCreate = () => InstitutionFormDialog.call({});
	const openEdit = (institution: Institution) =>
		InstitutionFormDialog.call({ institution });

	const confirmDelete = (institution: Institution) =>
		confirmAction({
			title: t("admin.institutions.delete.title", {
				defaultValue: "Delete institution",
			}),
			message: t("admin.institutions.delete.message", {
				defaultValue:
					"Are you sure you want to delete this institution? This action cannot be undone.",
			}),
			onConfirm: () =>
				deleteInstitutions.mutateAsync([institution.id]).catch(() => undefined),
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
				deleteInstitutions.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (institution: Institution): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openEdit(institution),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(institution),
		},
	];

	const addLabel = t("admin.institutions.actions.add", {
		defaultValue: "Add institution",
	});

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.institutions.title", {
						defaultValue: "Institutions",
					})}
					description={t("admin.institutions.subtitle", {
						defaultValue: "Manage universities, faculties and schools.",
					})}
					actions={
						<Button onClick={openCreate}>
							<Plus className="mr-2 h-4 w-4" />
							{addLabel}
						</Button>
					}
				/>
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
						disabled={deleteInstitutions.isPending}
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						{t("common.actions.delete")}
					</Button>
				</BulkActionBar>
			}
		>
			<DataTable
				columns={columns}
				data={institutions}
				isLoading={isLoading}
				selection={selection}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Building2 className="h-6 w-6" />}
						title={t("admin.institutions.empty.title", {
							defaultValue: "No institutions yet",
						})}
						description={t("admin.institutions.empty.description", {
							defaultValue:
								"Create your first institution to start organizing your academic structure.",
						})}
						cta={{
							label: addLabel,
							onClick: openCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
