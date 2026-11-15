import * as XLSX from "xlsx";
import i18n from "@/i18n";
import type { GradesByStudent, RosterStudent } from "../types";

type TemplateColumn = "registrationNumber" | "firstName" | "lastName" | "score";

const TEMPLATE_COLUMN_KEYS = {
	registrationNumber: "teacher.gradeEntry.template.registrationNumber",
	firstName: "teacher.gradeEntry.template.firstName",
	lastName: "teacher.gradeEntry.template.lastName",
	score: "teacher.gradeEntry.template.score",
} as const satisfies Record<TemplateColumn, string>;

/** Languages whose headers are accepted on import (a template may be filled in either). */
const TEMPLATE_LANGUAGES = ["en", "fr"] as const;

type TemplateRow = Record<string, string | number | null | undefined>;

const columnHeader = (column: TemplateColumn) =>
	i18n.t(TEMPLATE_COLUMN_KEYS[column]);

/** Value of a column in an imported row, whatever the template language. */
const readColumn = (row: TemplateRow, column: TemplateColumn) => {
	for (const lng of TEMPLATE_LANGUAGES) {
		const value = row[i18n.t(TEMPLATE_COLUMN_KEYS[column], { lng })];
		if (value !== undefined) return value;
	}
	return undefined;
};

/** Excel template of an exam: one row per student with the current score. */
export function exportGradeTemplate({
	students,
	gradesByStudent,
	courseName,
	examName,
}: {
	students: RosterStudent[];
	gradesByStudent: GradesByStudent;
	courseName?: string;
	examName: string;
}) {
	const data = students.map((student) => ({
		[columnHeader("registrationNumber")]: student.registrationNumber || "",
		[columnHeader("firstName")]: student.firstName,
		[columnHeader("lastName")]: student.lastName,
		[columnHeader("score")]: gradesByStudent[student.id]?.score ?? "",
	}));

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		workbook,
		worksheet,
		i18n.t("teacher.gradeEntry.template.sheetName"),
	);

	const prefix = courseName || i18n.t("teacher.gradeEntry.template.filePrefix");
	const fileName = `${prefix}_${examName}_${new Date().toISOString().split("T")[0]}.xlsx`;
	XLSX.writeFile(workbook, fileName);
}

/**
 * Reads a filled template: students are matched by registration number, or
 * by first + last name. Returns the form values (`student_<id>`) of the
 * valid scores (0–20).
 */
export function readGradeImport(
	file: File,
	students: RosterStudent[],
): Promise<{ updates: Record<string, number>; importedCount: number }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				const jsonData = XLSX.utils.sheet_to_json(worksheet) as TemplateRow[];

				const updates: Record<string, number> = {};
				let importedCount = 0;

				jsonData.forEach((row) => {
					const registrationNumber = readColumn(row, "registrationNumber");
					const firstName = readColumn(row, "firstName");
					const lastName = readColumn(row, "lastName");
					const rawScore = readColumn(row, "score");
					const student = students.find(
						(s) =>
							(registrationNumber !== undefined &&
								s.registrationNumber === String(registrationNumber)) ||
							(s.firstName === firstName && s.lastName === lastName),
					);

					if (
						student &&
						rawScore !== undefined &&
						rawScore !== "" &&
						rawScore !== null
					) {
						const score = Number(rawScore);
						if (!Number.isNaN(score) && score >= 0 && score <= 20) {
							updates[`student_${student.id}`] = score;
							importedCount++;
						}
					}
				});

				resolve({ updates, importedCount });
			} catch (error) {
				reject(error);
			}
		};
		reader.readAsArrayBuffer(file);
	});
}
