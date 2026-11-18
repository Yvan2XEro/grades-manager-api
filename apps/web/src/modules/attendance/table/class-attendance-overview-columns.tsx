import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { overviewRateColor } from "../services/attendance-rates";
import type { ClassCourseOverviewRow } from "../types";

const right = (label: string) => () => (
	<span className="block text-right">{label}</span>
);

export function getClassAttendanceOverviewColumns(
	t: TFunction,
): ColumnDef<ClassCourseOverviewRow>[] {
	return [
		{
			id: "course",
			header: t("admin.attendance.overview.course"),
			cell: ({ row }) => row.original.courseName ?? row.original.code,
		},
		{
			id: "code",
			header: t("admin.attendance.overview.code"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-xs">
					{row.original.code}
				</span>
			),
		},
		{
			id: "sessions",
			header: right(t("admin.attendance.overview.sessions")),
			cell: ({ row }) => (
				<div className="text-right tabular-nums">
					{row.original.totalSessions}
				</div>
			),
		},
		{
			id: "rate",
			header: right(t("admin.attendance.overview.rate")),
			cell: ({ row: { original: row } }) => (
				<div
					className={`text-right tabular-nums ${overviewRateColor(row.attendanceRate, row.threshold)}`}
				>
					{row.attendanceRate !== null ? `${row.attendanceRate}%` : "—"}
				</div>
			),
		},
		{
			id: "threshold",
			header: right(t("admin.attendance.overview.threshold")),
			cell: ({ row }) => (
				<div className="text-right text-muted-foreground tabular-nums">
					{row.original.threshold !== null ? `${row.original.threshold}%` : "—"}
				</div>
			),
		},
	];
}
