import { BarChart3, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/data-table";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { ListLayout } from "@/components/layouts/ListLayout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { AttendanceClassCourseSelect } from "../components/attendance-class-course-select";
import { useAttendanceClassCourses } from "../hooks/use-attendance-class-courses";
import { useStudentAttendanceRates } from "../hooks/use-attendance-rates";
import { exportAttendanceRates } from "../services/attendance-rates";
import { getAttendanceRatesColumns } from "../table/attendance-rates-columns";

export default function AttendanceRatesPage() {
	const { t } = useTranslation();
	const [academicYearId, setAcademicYearId] = useState<string | null>(null);
	const [classCourseId, setClassCourseId] = useState<string | null>(null);
	const classCourses = useAttendanceClassCourses(
		"classCourses-for-attendance-rates",
		academicYearId,
	);
	const { rows, sortedRows, totalSessions, threshold, isPending } =
		useStudentAttendanceRates(classCourseId, academicYearId);
	const columns = useMemo(
		() => getAttendanceRatesColumns(t, threshold),
		[t, threshold],
	);

	const courseLabel =
		classCourses.find((c) => c.id === classCourseId)?.courseRef?.name ?? "";
	const hasRows = Boolean(classCourseId) && !isPending && rows.length > 0;

	const emptyState = (description: string) => (
		<Empty>
			<EmptyHeader>
				<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
			</EmptyHeader>
			<EmptyTitle>{t("attendanceRates.title")}</EmptyTitle>
			<EmptyDescription>{description}</EmptyDescription>
		</Empty>
	);

	return (
		<ListLayout
			header={
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-semibold text-xl">
							{t("attendanceRates.title")}
						</h1>
						<p className="text-muted-foreground text-sm">
							{t("attendanceRates.subtitle")}
						</p>
					</div>
					{hasRows && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => exportAttendanceRates(rows, t)}
						>
							<Download className="mr-1.5 h-4 w-4" />
							{t("attendanceRates.export")}
						</Button>
					)}
				</div>
			}
			toolbar={
				<>
					<div className="flex flex-wrap gap-4">
						<div className="w-64">
							<Label className="mb-1.5 block text-xs">
								{t("teacher.attendanceManagement.filterByYear")}
							</Label>
							<AcademicYearSelect
								value={academicYearId}
								onChange={(v) => {
									setAcademicYearId(v);
									setClassCourseId(null);
								}}
							/>
						</div>
						<div className="w-72">
							<Label className="mb-1.5 block text-xs">
								{t("teacher.attendanceManagement.filterByCourse")}
							</Label>
							<AttendanceClassCourseSelect
								classCourses={classCourses}
								value={classCourseId}
								onChange={setClassCourseId}
								placeholder={t("teacher.attendanceManagement.filterByCourse")}
								classNameClassName="text-xs"
							/>
						</div>
					</div>
					{hasRows && (
						<p className="text-muted-foreground text-sm">
							{courseLabel} — {totalSessions} {t("attendanceRates.sessions")}
						</p>
					)}
				</>
			}
		>
			{!classCourseId ? (
				emptyState(t("attendanceRates.empty"))
			) : isPending ? (
				<p className="p-4 text-muted-foreground text-sm">…</p>
			) : (
				<DataTable
					columns={columns}
					data={sortedRows}
					empty={emptyState(t("attendanceRates.noData"))}
				/>
			)}
		</ListLayout>
	);
}
