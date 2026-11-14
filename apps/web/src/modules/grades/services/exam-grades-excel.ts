import { format } from "date-fns";
import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type {
	ExamItem,
	ExportConfig,
	ExportContext,
	StudentExport,
} from "../types";
import { buildDocumentHeader } from "./export-header";
import { sortStudentsByName } from "./student-grades";

/** Grades of one exam ("publication des notes") as Excel. */
export function exportExamGradesExcel({
	exam,
	students,
	config,
	context,
	filename,
	t,
}: {
	exam: ExamItem;
	students: StudentExport[];
	config: ExportConfig;
	context: ExportContext;
	filename: string;
	t: TFunction;
}) {
	const headerRows = buildDocumentHeader(
		config,
		`PUBLICATION DES NOTES - ${exam.courseName} (${exam.type})`,
		context,
		exam.date ? [`Date: ${format(new Date(exam.date), "dd/MM/yyyy")}`] : [],
	);

	const exportData = sortStudentsByName(students).map((student) => {
		const grade = student.grades.find((g) => g.exam.id === exam.id);
		return {
			[t("admin.gradeExport.columns.lastName")]: student.last_name,
			[t("admin.gradeExport.columns.firstName")]: student.first_name,
			[t("admin.gradeExport.columns.registration")]:
				student.registration_number,
			[t("admin.gradeExport.actions.examGroup.scoreColumn")]:
				typeof grade?.score === "number" ? grade.score : "",
		};
	});

	// Create worksheet with header rows
	const ws = XLSX.utils.aoa_to_sheet(headerRows);
	XLSX.utils.sheet_add_json(ws, exportData, { origin: -1 });

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		wb,
		ws,
		t("admin.gradeExport.actions.examGroup.sheetName"),
	);
	// Apply styling
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
	const merges: XLSX.Range[] = [];
	if (ws.A1) {
		ws.A1.s = {
			font: { bold: true, sz: 16 },
			alignment: { horizontal: "center" },
		};
		merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
	}
	if (ws.A2) {
		ws.A2.s = {
			font: { bold: true, sz: 14 },
			alignment: { horizontal: "center" },
		};
		merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
	}
	for (let i = 0; i < headerRows.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
		if (ws[cellRef] && typeof ws[cellRef].v === "string") {
			const value = ws[cellRef].v;
			if (value.startsWith("PUBLICATION")) {
				ws[cellRef].s = {
					font: { bold: true, sz: 18 },
					alignment: { horizontal: "center" },
				};
				merges.push({
					s: { r: i, c: 0 },
					e: { r: i, c: 3 },
				});
			} else if (value.includes(":")) {
				ws[cellRef].s = { font: { bold: true } };
			}
		}
	}
	const headerRowIndex = headerRows.length;
	for (let c = 0; c <= 3; c++) {
		const cellRef = XLSX.utils.encode_cell({
			r: headerRowIndex,
			c,
		});
		if (ws[cellRef])
			ws[cellRef].s = {
				font: { bold: true, color: { rgb: "FFFFFF" } },
				fill: { fgColor: { rgb: "4472C4" } },
				alignment: { horizontal: "center" },
				border: {
					top: { style: "thin" },
					bottom: { style: "thin" },
					left: { style: "thin" },
					right: { style: "thin" },
				},
			};
	}
	for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
		for (let c = 0; c <= 3; c++) {
			const cellRef = XLSX.utils.encode_cell({ r, c });
			if (ws[cellRef]) {
				ws[cellRef].s = {
					alignment: { horizontal: "center" },
					border: {
						top: { style: "thin" },
						bottom: { style: "thin" },
						left: { style: "thin" },
						right: { style: "thin" },
					},
				};
				if ((r - headerRowIndex - 1) % 2 === 1)
					ws[cellRef].s.fill = {
						fgColor: { rgb: "F2F2F2" },
					};
			}
		}
	}
	ws["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
	ws["!merges"] = merges;

	XLSX.writeFile(wb, filename);
}
