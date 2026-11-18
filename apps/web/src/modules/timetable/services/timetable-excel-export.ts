import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type { Session } from "../types";

/** Saves the sessions as `timetable.xlsx`, in the import file's columns. */
export function exportTimetableExcel(sessions: Session[], t: TFunction) {
	const rows = sessions.map((s) => ({
		classCourseId: s.classCourseId,
		[t("teacher.timetable.course")]: s.classCourse?.courseRef?.name ?? "",
		[t("teacher.timetable.class")]: s.classCourse?.classRef?.name ?? "",
		dayOfWeek: s.dayOfWeek,
		startTime: s.startTime,
		endTime: s.endTime,
		validFrom: s.validFrom ?? "",
		validUntil: s.validUntil ?? "",
		[t("teacher.timetable.room")]: s.room ?? "",
		roomId: s.roomId ?? "",
	}));
	const ws = XLSX.utils.json_to_sheet(rows);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, t("teacher.timetable.title"));
	XLSX.writeFile(wb, "timetable.xlsx");
}
