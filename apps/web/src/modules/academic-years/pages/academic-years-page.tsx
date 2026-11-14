import { CalendarPlus, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { UndrawCalendar } from "@/components/ui/undraw";
import { useRowSelection } from "@/hooks/useRowSelection";
import { AcademicYearFormDialog } from "../components/academic-year-form-dialog";
import { AcademicYearSetupDialog } from "../components/academic-year-setup-dialog";
import {
	useAcademicYears,
	useCreateNextAcademicYear,
	useDeleteAcademicYears,
	useToggleAcademicYearActive,
} from "../hooks/use-academic-years";
import { getAcademicYearsColumns } from "../table/academic-years-columns";
import type { AcademicYearRow } from "../types";

export default function AcademicYearsPage() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, academicYears, isLoading } = useAcademicYears({
		page,
		pageSize,
	});
	const selection = useRowSelection(academicYears);
	const deleteYears = useDeleteAcademicYears();
	const toggleActive = useToggleAcademicYearActive();

	const openYearForm = (year?: AcademicYearRow) =>
		AcademicYearFormDialog.call({ year });

	const openSetup = (year: { id: string; name: string }) =>
		AcademicYearSetupDialog.call({
			targetYear: { id: year.id, name: year.name },
		});

	// Auto-open the setup dialog for the new year
	const createNextYear = useCreateNextAcademicYear(openSetup);

	const columns = useMemo(
		() =>
			getAcademicYearsColumns(t, (year) =>
				toggleActive.mutate({ id: year.id, isActive: !year.isActive }),
			),
		[t, toggleActive.mutate],
	);

	const confirmDelete = (year: AcademicYearRow) =>
		confirmAction({
			title: t("common.actions.delete"),
			message: t("admin.academicYears.confirmDelete"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				deleteYears.mutateAsync([year.id]).catch(() => undefined),
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
				deleteYears.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (year: AcademicYearRow): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => openYearForm(year),
		},
		{
			label: t("admin.academicYears.setup.button", { defaultValue: "Setup" }),
			icon: Copy,
			onSelect: () => openSetup(year),
		},
		{
			label: t("admin.academicYears.actions.createNextYear", {
				defaultValue: "Créer l'année suivante",
			}),
			icon: CalendarPlus,
			disabled: createNextYear.isPending,
			onSelect: () => createNextYear.mutate(year.id),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(year),
		},
	];

	const addButton = (
		<Button type="button" onClick={() => openYearForm()}>
			<Plus className="mr-2 h-4 w-4" />
			{t("admin.academicYears.actions.add")}
		</Button>
	);

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.academicYears.title")}
					description={t("admin.academicYears.subtitle")}
					actions={addButton}
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
						disabled={deleteYears.isPending}
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						{t("common.actions.delete")}
					</Button>
				</BulkActionBar>
			}
			footer={
				academicYears.length > 0 && (
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
				data={academicYears}
				isLoading={isLoading}
				selection={selection}
				rowActions={rowActions}
				empty={
					<div className="p-8 text-center">
						<UndrawCalendar className="mx-auto h-36 w-auto" />
						<h3 className="mt-4 font-medium text-foreground text-lg">
							{t("admin.academicYears.empty.title")}
						</h3>
						<p className="mt-1 mb-4 text-muted-foreground">
							{t("admin.academicYears.empty.description")}
						</p>
						{addButton}
					</div>
				}
			/>
		</ListLayout>
	);
}
