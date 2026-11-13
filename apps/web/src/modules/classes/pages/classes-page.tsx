import {
	Download,
	FileSpreadsheet,
	FileText,
	Pencil,
	Plus,
	Trash2,
	Users,
	Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { PeriodFilters } from "@/components/period-filters";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkClassExportDialog } from "@/modules/documents/editor/BulkClassExportDialog";
import { BulkGenerateClassesDialog } from "../components/bulk-generate-classes-dialog";

import { ClassFormDialog } from "../components/class-form-dialog";
import { useClasses, useDeleteClasses } from "../hooks/use-classes";
import {
	exportStudentListExcel,
	exportStudentListPdf,
} from "../services/student-list-export";
import { getClassesColumns } from "../table/classes-columns";
import type { ClassRow } from "../types";

export default function ClassesPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, classes, isLoading } = useClasses({
		page,
		pageSize,
		academicYearId,
		semesterId,
	});
	const selection = useRowSelection(classes);
	const deleteClasses = useDeleteClasses();
	const columns = useMemo(() => getClassesColumns(t), [t]);

	const openDetail = (cls: ClassRow) => navigate(`/classes/${cls.id}/details`);

	const openCreate = async () => {
		const created = await ClassFormDialog.call({
			defaults: { academicYearId: academicYearId ?? undefined },
			existingCodes: classes.map((cls) => cls.code).filter(Boolean),
		});
		if (created?.id) navigate(`/classes/${created.id}/details`);
	};

	const confirmDelete = (cls: ClassRow) =>
		confirmAction({
			title: t("admin.classes.delete.title"),
			message:
				cls.studentCount > 0
					? t("admin.classes.delete.messageWithStudents", {
							count: cls.studentCount,
						})
					: t("admin.classes.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				deleteClasses.mutateAsync([cls.id]).catch(() => undefined),
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
				deleteClasses.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (cls: ClassRow): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openDetail(cls),
		},
		{
			label: t("admin.classes.export.button", { defaultValue: "Export PDF" }),
			icon: FileText,
			separator: true,
			onSelect: () => exportStudentListPdf(cls, t),
		},
		{
			label: t("admin.classes.export.excelButton", {
				defaultValue: "Export Excel",
			}),
			icon: FileSpreadsheet,
			onSelect: () => exportStudentListExcel(cls, t),
		},
		{
			label: t("common.actions.delete", { defaultValue: "Delete" }),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(cls),
		},
	];

	const resetPage =
		<T,>(setter: (value: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.classes.title")}
					description={t("admin.classes.subtitle")}
					actions={
						<>
							<Button
								variant="outline"
								onClick={() => BulkGenerateClassesDialog.call()}
							>
								<Wand2 className="mr-2 h-4 w-4" />
								{t("admin.classes.actions.bulkGenerate", {
									defaultValue: "Générer les classes",
								})}
							</Button>
							<Button
								variant="outline"
								onClick={() => BulkClassExportDialog.call({ classes })}
								disabled={classes.length === 0}
							>
								<Download className="mr-2 h-4 w-4" />
								{t("admin.classes.actions.bulkExport", {
									defaultValue: "Exporter en lot",
								})}
							</Button>
							<Button onClick={openCreate}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.classes.actions.add")}
							</Button>
						</>
					}
				/>
			}
			toolbar={
				<>
					<PeriodFilters
						academicYearId={academicYearId}
						semesterId={semesterId}
						onAcademicYearChange={resetPage(setAcademicYearId)}
						onSemesterChange={resetPage(setSemesterId)}
					/>

					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={deleteClasses.isPending}
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
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
				/>
			}
		>
			<DataTable
				columns={columns}
				data={classes}
				isLoading={isLoading}
				selection={selection}
				onRowClick={openDetail}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<Users className="h-6 w-6" />}
						title={t("admin.classes.empty.title")}
						description={t("admin.classes.empty.description")}
						cta={{
							label: t("admin.classes.actions.add"),
							onClick: openCreate,
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
