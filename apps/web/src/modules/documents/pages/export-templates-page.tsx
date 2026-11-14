import { FileText, Pencil, Plus, Settings, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader } from "@/components/ui/empty";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import type { ExportTemplate } from "@/utils/type";
import { RenameTemplateDialog } from "../components/rename-template-dialog";
import {
	useExportTemplateMutations,
	useExportTemplates,
	useSystemTemplates,
} from "../hooks/use-export-templates";
import { getExportTemplatesColumns } from "../table/export-templates-columns";
import { EXPORT_TYPES } from "../types";

export default function ExportTemplatesManagement() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [selectedType, setSelectedType] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, templates, isLoading } = useExportTemplates({
		page,
		pageSize,
		selectedType,
	});
	const selection = useRowSelection(templates);
	const { deleteMutation, setDefaultMutation, bulkDeleteMutation } =
		useExportTemplateMutations();
	const { seedSystemMutation, exportAllMutation } = useSystemTemplates();
	const columns = useMemo(() => getExportTemplatesColumns(t), [t]);

	const openEditor = (template: ExportTemplate) =>
		navigate(`/export-templates/${template.id}`);
	const openCreate = () => navigate("/export-templates/new");

	const confirmDelete = (template: ExportTemplate) =>
		confirmAction({
			title: t("admin.exportTemplates.delete.title"),
			message: t("admin.exportTemplates.delete.message", {
				name: template.name,
			}),
			onConfirm: () =>
				deleteMutation.mutateAsync(template.id).catch(() => undefined),
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
				bulkDeleteMutation.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (template: ExportTemplate): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Settings,
			onSelect: () => openEditor(template),
		},
		{
			label: t("common.actions.rename", { defaultValue: "Rename" }),
			icon: Pencil,
			onSelect: () => RenameTemplateDialog.call({ template }),
		},
		{
			label: t("admin.exportTemplates.actions.setDefault", {
				defaultValue: "Set as default",
			}),
			icon: Star,
			disabled: template.isDefault || setDefaultMutation.isPending,
			onSelect: () =>
				setDefaultMutation.mutate({ id: template.id, type: template.type }),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			disabled: template.isDefault,
			onSelect: () => confirmDelete(template),
		},
	];

	return (
		<ListLayout
			header={
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-foreground">
							{t("admin.exportTemplates.title")}
						</h1>
						<p className="text-muted-foreground">
							{t("admin.exportTemplates.subtitle")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => exportAllMutation.mutate()}
							disabled={exportAllMutation.isPending}
							title="Génère un PDF par modèle (16 fichiers — 8 types × standard + centre) avec les vraies infos d'institution et centre, étudiant fictif. Téléchargement ZIP."
						>
							{exportAllMutation.isPending ? (
								<Spinner className="mr-2" />
							) : (
								<FileText className="mr-2 h-4 w-4" />
							)}
							{exportAllMutation.isPending
								? "Génération en cours…"
								: "Télécharger tous les modèles (PDF)"}
						</Button>
						<Button
							variant="outline"
							onClick={() => seedSystemMutation.mutate()}
							disabled={seedSystemMutation.isPending}
							title="Crée les 3 modèles officiels (diplôme, relevé, attestation) si absents"
						>
							{seedSystemMutation.isPending && <Spinner className="mr-2" />}
							Initialiser modèles officiels
						</Button>
						<Button onClick={openCreate}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.exportTemplates.actions.add")}
						</Button>
					</div>
				</div>
			}
			toolbar={
				<>
					<div className="flex items-center justify-between gap-4">
						<div>
							<h2 className="font-semibold">
								{t("admin.exportTemplates.table.title")}
							</h2>
							<p className="text-muted-foreground text-sm">
								{t("admin.exportTemplates.table.description")}
							</p>
						</div>
						<Select
							value={selectedType}
							onValueChange={(value) => {
								setSelectedType(value);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{t("admin.exportTemplates.filter.all")}
								</SelectItem>
								{EXPORT_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={bulkDeleteMutation.isPending}
						>
							<Trash2 className="mr-1.5 h-3.5 w-3.5" />
							{t("common.actions.delete")}
						</Button>
					</BulkActionBar>
				</>
			}
			footer={
				<TablePagination
					page={page}
					pageCount={data?.pageCount ?? 1}
					total={data?.total ?? 0}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={(s) => {
						setPageSize(s);
						setPage(1);
					}}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={templates}
				isLoading={isLoading}
				selection={selection}
				onRowClick={openEditor}
				rowActions={rowActions}
				empty={
					<Empty>
						<EmptyHeader>
							<FileText className="h-12 w-12" />
						</EmptyHeader>
						<EmptyContent>
							<h3 className="font-semibold text-foreground text-lg">
								{t("admin.exportTemplates.empty.title")}
							</h3>
							<p className="text-muted-foreground text-xs">
								{t("admin.exportTemplates.empty.description")}
							</p>
							<Button onClick={openCreate} className="mt-4">
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.exportTemplates.actions.add")}
							</Button>
						</EmptyContent>
					</Empty>
				}
			/>
		</ListLayout>
	);
}
