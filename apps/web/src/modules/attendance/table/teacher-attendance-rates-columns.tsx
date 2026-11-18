import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import type { TeacherCourseRateRow } from "../types";

const aligned = (label: string, align: "right" | "center") => () => (
	<span
		className={align === "right" ? "block text-right" : "block text-center"}
	>
		{label}
	</span>
);

export function getTeacherAttendanceRatesColumns(
	t: TFunction,
): ColumnDef<TeacherCourseRateRow>[] {
	return [
		{
			id: "course",
			header: t("teacher.attendanceRates.columns.course"),
			cell: ({ row: { original: row } }) => (
				<div>
					<p className="font-medium text-sm">
						{row.courseName ?? row.courseCode}
					</p>
					{row.courseCode && row.courseName && (
						<p className="text-muted-foreground text-xs">{row.courseCode}</p>
					)}
				</div>
			),
		},
		{
			id: "class",
			header: t("teacher.attendanceRates.columns.class"),
			cell: ({ row }) => (
				<span className="text-sm">{row.original.className ?? "—"}</span>
			),
		},
		{
			id: "sessions",
			header: aligned(t("teacher.attendanceRates.columns.sessions"), "right"),
			cell: ({ row }) => (
				<div className="text-right text-sm tabular-nums">
					{row.original.totalSessions}
				</div>
			),
		},
		{
			id: "threshold",
			header: aligned(t("teacher.attendanceRates.columns.threshold"), "right"),
			cell: ({ row }) => (
				<div className="text-right text-sm tabular-nums">
					{row.original.threshold != null ? `${row.original.threshold}%` : "—"}
				</div>
			),
		},
		{
			id: "belowThreshold",
			header: aligned(
				t("teacher.attendanceRates.columns.belowThreshold"),
				"right",
			),
			cell: ({ row: { original: row } }) => (
				<div className="text-right">
					{row.threshold != null ? (
						<span
							className={
								row.belowThreshold > 0
									? "font-medium text-destructive text-sm tabular-nums"
									: "text-sm tabular-nums"
							}
						>
							{row.belowThreshold}
						</span>
					) : (
						<span className="text-muted-foreground text-sm">—</span>
					)}
				</div>
			),
		},
		{
			id: "excusedCountsAsAbsent",
			header: aligned(
				t("teacher.attendanceRates.columns.excusedCountsAsAbsent"),
				"center",
			),
			cell: ({ row }) => (
				<div className="text-center">
					{row.original.excusedCountsAsAbsent ? (
						<Badge variant="secondary" className="text-xs">
							{t("common.yes")}
						</Badge>
					) : (
						<Badge variant="outline" className="text-xs">
							{t("common.no")}
						</Badge>
					)}
				</div>
			),
		},
	];
}
