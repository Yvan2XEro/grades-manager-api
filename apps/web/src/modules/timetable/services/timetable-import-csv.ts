import Papa from "papaparse";
import { downloadBlob } from "@/lib/download";
import type { TimetableClassCourse } from "../types";

/** A session row of the import CSV, as sent to the bulk import preview. */
export type ParsedRow = {
	id?: string;
	classCourseId: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	room?: string;
	roomId?: string;
	validFrom?: string;
	validUntil?: string;
};

const clean = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

/** Parses an import CSV (header row) into session rows. */
export function parseTimetableCsv(
	file: File,
	onParsed: (rows: ParsedRow[]) => void,
) {
	Papa.parse<Record<string, string>>(file, {
		header: true,
		skipEmptyLines: true,
		complete: ({ data }) => {
			onParsed(
				data.map((r) => ({
					id: clean(r.id),
					classCourseId: clean(r.classCourseId) ?? "",
					dayOfWeek: clean(r.dayOfWeek) ?? "",
					startTime: clean(r.startTime) ?? "",
					endTime: clean(r.endTime) ?? "",
					room: clean(r.room),
					roomId: clean(r.roomId),
					validFrom: clean(r.validFrom),
					validUntil: clean(r.validUntil),
				})),
			);
		},
	});
}

/**
 * Saves an import template: one line per given class course, or two example
 * lines when none is given.
 */
export function downloadTimetableTemplate(
	classCourses: Pick<
		TimetableClassCourse,
		"id" | "code" | "courseRef" | "classRef"
	>[],
) {
	const header =
		"id,courseName,className,classCourseId,dayOfWeek,startTime,endTime,room,roomId,validFrom,validUntil";
	let rows: string;
	if (classCourses.length > 0) {
		rows = classCourses
			.map((cc) => {
				const course = cc.courseRef?.name ?? cc.code;
				const klass = cc.classRef?.name ?? "";
				return `,${course},${klass},${cc.id},mon,08:00,10:00,,,,`;
			})
			.join("\n");
	} else {
		rows = [
			",Mathématiques,L1 Info,<id-class-course>,mon,08:00,10:00,Amphi A,,2026-09-01,2026-12-31",
			"<session-id>,Anglais,L1 Info,<id-class-course>,tue,10:00,12:00,Salle 201,,2027-01-01,2027-06-30",
		].join("\n");
	}
	downloadBlob(
		new Blob([`${header}\n${rows}`], { type: "text/csv" }),
		"timetable-import-template.csv",
	);
}
