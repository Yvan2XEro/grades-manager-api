import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { DataTable } from "@/components/data-table";
import { ListLayout } from "@/components/layouts/ListLayout";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { EnrollmentFilters } from "../components/enrollment-filters";
import { EnrollmentWindowCard } from "../components/enrollment-window-card";
import { StudentCourseRosterDialog } from "../components/student-course-roster-dialog";
import {
	type EnrollmentFilters as Filters,
	useDeleteEnrollments,
	useEnrollments,
} from "../hooks/use-enrollments";
import { getEnrollmentsColumns } from "../table/enrollments-columns";
import type { EnrollmentRow } from "../types";

const emptyFilters: Filters = {
	academicYearId: "",
	classId: "",
	semesterId: "",
	status: "all",
};

/** "Enrollments" tab of the classes hub. */
export default function EnrollmentsPage() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<Filters>(emptyFilters);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const {
		classes,
		selectedClass,
		rows,
		page: enrollmentsPage,
		isLoading,
		studentsCount,
		classCoursesCount,
		windowStatus,
	} = useEnrollments(filters, { page, pageSize });
	const selection = useRowSelection(rows);
	const deleteEnrollments = useDeleteEnrollments();

	const changeFilters = (patch: Partial<Filters>) => {
		setFilters((prev) => ({ ...prev, ...patch }));
		// the semester only filters the class courses, not the enrollments
		if (Object.keys(patch).some((key) => key !== "semesterId")) setPage(1);
	};

	const columns = useMemo(
		() =>
			getEnrollmentsColumns(t, (row: EnrollmentRow) =>
				StudentCourseRosterDialog.call({
					studentId: row.studentId,
					studentName: row.student
						? `${row.student.profile.firstName} ${row.student.profile.lastName}`
						: "",
					classId: filters.classId,
					semesterId: filters.semesterId || undefined,
				}),
			),
		[t, filters.classId, filters.semesterId],
	);

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
				deleteEnrollments.mutate([...selection.selectedIds], {
					onSuccess: selection.clear,
				}),
		});

	return (
		<ListLayout
			header={
				<>
					<EnrollmentFilters
						filters={filters}
						onChange={changeFilters}
						onReset={() => setFilters(emptyFilters)}
						classes={classes}
						studentsCount={studentsCount}
						selectedClass={selectedClass}
						windowStatus={windowStatus?.status}
					/>
					<EnrollmentWindowCard
						academicYearId={filters.academicYearId}
						classId={filters.classId}
						semesterId={filters.semesterId}
						classSemesterId={selectedClass?.semester?.id}
						classes={classes}
						windowStatus={windowStatus}
						studentsCount={studentsCount}
						coursesCount={classCoursesCount}
					/>
				</>
			}
			toolbar={
				<>
					<h2 className="font-semibold text-foreground text-lg">
						{t("admin.enrollments.listTitle", {
							defaultValue: "Enrollments",
						})}
					</h2>
					<BulkActionBar
						selectedCount={selection.selectedCount}
						onClear={selection.clear}
					>
						<Button
							variant="destructive"
							size="sm"
							onClick={confirmBulkDelete}
							disabled={deleteEnrollments.isPending}
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
					pageCount={enrollmentsPage?.pageCount ?? 1}
					total={enrollmentsPage?.total ?? 0}
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
				data={rows}
				isLoading={isLoading}
				selection={selection}
				empty={
					<p className="p-4 text-muted-foreground text-xs">
						{t("admin.enrollments.empty", {
							defaultValue: "No enrollments found for the selected filters.",
						})}
					</p>
				}
			/>
		</ListLayout>
	);
}
