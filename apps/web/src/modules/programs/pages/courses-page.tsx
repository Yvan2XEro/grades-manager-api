import { BookOpen, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable, type RowAction } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { CourseFormDialog } from "../components/course-form-dialog";
import {
	useCourseProgramNames,
	useCourses,
	useDeleteCourses,
} from "../hooks/use-courses";
import { useTeacherNames } from "../hooks/use-teachers";
import { getCoursesColumns } from "../table/courses-columns";
import type { CourseRow } from "../types";

export default function CoursesPage() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const { data, courses, isLoading } = useCourses({ page, pageSize });
	const selection = useRowSelection(courses);
	const deleteCourses = useDeleteCourses();
	const programNames = useCourseProgramNames();
	const teacherNames = useTeacherNames();
	const columns = useMemo(
		() => getCoursesColumns(t, programNames, teacherNames),
		[t, programNames, teacherNames],
	);

	const startCreate = () => CourseFormDialog.call({});
	const startEdit = (course: CourseRow) => CourseFormDialog.call({ course });

	const confirmDelete = (id: string) =>
		confirmAction({
			title: t("admin.courses.delete.title"),
			message: t("admin.courses.delete.message"),
			confirmText: t("common.actions.delete"),
			onConfirm: () => deleteCourses.mutateAsync([id]).catch(() => undefined),
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
				deleteCourses.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	const rowActions = (course: CourseRow): RowAction[] => [
		{
			label: t("common.actions.edit", { defaultValue: "Edit" }),
			icon: Pencil,
			onSelect: () => startEdit(course),
		},
		{
			label: t("common.actions.delete"),
			icon: Trash2,
			destructive: true,
			separator: true,
			onSelect: () => confirmDelete(course.id),
		},
	];

	return (
		<ListLayout
			header={
				<PageHeader
					title={t("admin.courses.title", {
						defaultValue: "Course management",
					})}
					description={t("admin.courses.subtitle", {
						defaultValue: "Manage courses, workloads, and default teachers.",
					})}
					actions={
						<Button onClick={startCreate}>
							<PlusIcon className="mr-2 h-4 w-4" />
							{t("admin.courses.actions.add")}
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
						disabled={deleteCourses.isPending}
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
				data={courses}
				isLoading={isLoading}
				selection={selection}
				onRowClick={startEdit}
				rowActions={rowActions}
				empty={
					<EmptyState
						className="m-4"
						icon={<BookOpen className="h-6 w-6" />}
						title={t("admin.courses.empty.title", {
							defaultValue: "No courses available",
						})}
						description={t("admin.courses.empty.description", {
							defaultValue: "Create a course to populate the catalog.",
						})}
						cta={{
							label: t("admin.courses.actions.add"),
							onClick: startCreate,
							icon: <PlusIcon className="h-4 w-4" />,
						}}
					/>
				}
			/>
		</ListLayout>
	);
}
