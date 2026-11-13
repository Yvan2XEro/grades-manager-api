import {
	BookOpen,
	FileDown,
	Layers,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { AssignTeachingUnitDialog } from "../components/assign-teaching-unit-dialog";
import { AutoEnrollClassDialog } from "../components/auto-enroll-class-dialog";
import { ClassCourseFormDialog } from "../components/class-course-form-dialog";
import { CourseCatalogExportDialog } from "../components/course-catalog-export-dialog";
import {
	useClassCourses,
	useDeleteClassCourses,
} from "../hooks/use-class-courses";
import { getClassCoursesColumns } from "../table/class-courses-columns";
import type { ClassCourseRow } from "../types";

export default function ClassCoursesPage() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [semesterId, setSemesterId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, classCourses, isLoading } = useClassCourses({
		page,
		pageSize,
		academicYearId,
		semesterId,
	});
	const selection = useRowSelection(classCourses);
	const deleteClassCourses = useDeleteClassCourses();
	const columns = useMemo(() => getClassCoursesColumns(t), [t]);
	const existingCodes = classCourses.map((cc) => cc.code).filter(Boolean);

	const openForm = (classCourse?: ClassCourseRow) =>
		ClassCourseFormDialog.call({
			classCourse,
			existingCodes,
			academicYearId,
		});

	const confirmDelete = (classCourse: ClassCourseRow) =>
		confirmAction({
			title: t("admin.classCourses.delete.title"),
			message: t("admin.classCourses.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				deleteClassCourses.mutateAsync([classCourse.id]).catch(() => undefined),
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
				deleteClassCourses.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (classCourse: ClassCourseRow): RowAction[] => [
		{
			label: t("common.actions.edit"),
			icon: Pencil,
			onSelect: () => openForm(classCourse),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(classCourse),
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
					title={t("admin.classCourses.title")}
					description={t("admin.classCourses.subtitle")}
					actions={
						<>
							<Button
								variant="outline"
								onClick={() =>
									CourseCatalogExportDialog.call({ academicYearId })
								}
							>
								<FileDown className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.exportPdf", {
									defaultValue: "Exporter PDF",
								})}
							</Button>
							<Button
								variant="outline"
								onClick={() => AutoEnrollClassDialog.call()}
							>
								<Users className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.autoEnroll", {
									defaultValue: "Inscrire les étudiants",
								})}
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									AssignTeachingUnitDialog.call({
										existingCodes,
										academicYearId,
									})
								}
							>
								<Layers className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.assignUe", {
									defaultValue: "Assigner un UE",
								})}
							</Button>
							<Button onClick={() => openForm()}>
								<Plus className="mr-2 h-4 w-4" />
								{t("admin.classCourses.actions.assign")}
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
							disabled={deleteClassCourses.isPending}
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
				data={classCourses}
				isLoading={isLoading}
				selection={selection}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<BookOpen className="h-6 w-6" />}
						title={t("admin.classCourses.empty.title")}
						description={t("admin.classCourses.empty.description")}
						cta={{
							label: t("admin.classCourses.actions.assign"),
							onClick: () => openForm(),
							icon: <Plus className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
