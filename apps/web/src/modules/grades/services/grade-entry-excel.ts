import * as XLSX from "xlsx";
import type { GradesByStudent, RosterStudent } from "../types";

type TemplateRow = {
	"Registration Number": string;
	"First Name": string;
	"Last Name": string;
	Score: number | string;
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
		"Registration Number": student.registrationNumber || "",
		"First Name": student.firstName,
		"Last Name": student.lastName,
		Score: gradesByStudent[student.id]?.score ?? "",
	}));

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

	const fileName = `${courseName || "grades"}_${examName}_${new Date().toISOString().split("T")[0]}.xlsx`;
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
					const student = students.find(
						(s) =>
							s.registrationNumber === row["Registration Number"] ||
							(s.firstName === row["First Name"] &&
								s.lastName === row["Last Name"]),
					);

					if (student && row.Score !== "" && row.Score !== null) {
						const score = Number(row.Score);
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
