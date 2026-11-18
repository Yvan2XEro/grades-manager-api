import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { rateColor } from "../services/attendance-rates";
import type { StudentRateRow } from "../types";

const centered =
	(label: string, className = "") =>
	() => <span className={`block text-center ${className}`}>{label}</span>;
const centeredCell = (value: number) => (
	<div className="text-center">{value}</div>
);

export function getAttendanceRatesColumns(
	t: TFunction,
	threshold: number | null,
): ColumnDef<StudentRateRow>[] {
	return [
		{
			id: "student",
			header: t("attendanceRates.student"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "regNumber",
			header: t("attendanceRates.regNumber"),
			cell: ({ row }) => (
				<span className="text-muted-foreground text-xs">
					{row.original.registrationNumber ?? "—"}
				</span>
			),
		},
		{
			id: "present",
			header: centered(
				t("teacher.attendanceManagement.status.present"),
				"text-green-700",
			),
			cell: ({ row }) => centeredCell(row.original.present),
		},
		{
			id: "late",
			header: centered(
				t("teacher.attendanceManagement.status.late"),
				"text-yellow-700",
			),
			cell: ({ row }) => centeredCell(row.original.late),
		},
		{
			id: "absent",
			header: centered(
				t("teacher.attendanceManagement.status.absent"),
				"text-red-700",
			),
			cell: ({ row }) => centeredCell(row.original.absent),
		},
		{
			id: "excused",
			header: centered(
				t("teacher.attendanceManagement.status.excused"),
				"text-blue-700",
			),
			cell: ({ row }) => centeredCell(row.original.excused),
		},
		{
			id: "rate",
			header: centered(t("attendanceRates.rate")),
			cell: ({ row }) => (
				<div className="text-center">
					<span
						className={`font-semibold ${rateColor(row.original.rate, threshold)}`}
					>
						{row.original.rate}%
					</span>
				</div>
			),
		},
	];
}
