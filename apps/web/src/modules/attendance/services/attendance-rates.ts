import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type { StudentRateRow } from "../types";

/** Rate colour: green from the threshold (75% by default), yellow from 2/3 of it. */
export function rateColor(rate: number, threshold: number | null): string {
	const pass = threshold ?? 75;
	const warn = Math.round(pass * 0.67);
	if (rate >= pass) return "text-green-700";
	if (rate >= warn) return "text-yellow-700";
	return "text-red-700";
}

/** Same scale for a possibly unknown rate, in medium weight. */
export function overviewRateColor(
	rate: number | null,
	threshold: number | null,
): string {
	if (rate === null) return "text-muted-foreground";
	return `${rateColor(rate, threshold)} font-medium`;
}

/** Writes the per-student attendance rates of a class course to an Excel file. */
export function exportAttendanceRates(rows: StudentRateRow[], t: TFunction) {
	const sheetRows = rows.map((s) => ({
		[t("attendanceRates.regNumber")]: s.registrationNumber ?? s.studentId,
		[t("attendanceRates.name")]: s.name,
		[t("attendanceRates.present")]: s.present,
		[t("attendanceRates.late")]: s.late,
		[t("attendanceRates.absent")]: s.absent,
		[t("attendanceRates.excused")]: s.excused,
		[t("attendanceRates.totalSessions")]: s.totalSessions,
		[t("attendanceRates.ratePercent")]: s.rate,
	}));
	const ws = XLSX.utils.json_to_sheet(sheetRows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, t("attendanceRates.title"));
	XLSX.writeFile(wb, t("attendanceRates.exportFilename"));
}
