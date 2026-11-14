import { format } from "date-fns";
import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type {
	ExamItem,
	ExportConfig,
	ExportContext,
	StudentExport,
} from "../types";
import { buildDocumentHeader, isInfoRow } from "./export-header";
import { resolveRetakeGrades } from "./retake-grades";
import { sortStudentsByName } from "./student-grades";

const TITLE = "RELEVÉ DE NOTES";

/** Average per course of the selected exams (retakes merged into their parent exam). */
function courseAveragesOf(student: StudentExport, selectedExams: string[]) {
	// Build exam list from student's grades for retake resolution
	const studentExamItems: ExamItem[] = student.grades.map((g) => ({
		id: g.exam.id,
		name: g.exam.name,
		type: g.exam.type,
		date: "",
		percentage: g.exam.percentage,
		courseName: g.exam.class_course.course.name,
		courseCode: g.exam.class_course.course.code,
		classCourseCode: g.exam.class_course.code,
		sessionType: g.exam.sessionType,
		parentExamId: g.exam.parentExamId,
		scoringPolicy: g.exam.scoringPolicy,
	}));

	// Resolve retake grades
	const studentGradesForResolution = student.grades.map((g) => ({
		examId: g.exam.id,
		score: g.score,
	}));
	const resolvedGrades = resolveRetakeGrades(
		studentGradesForResolution,
		studentExamItems,
	);

	// Group resolved grades by course
	const courseGrades = new Map<string, number[]>();
	for (const grade of student.grades) {
		// Skip retake exams - their scores are merged into parent exams
		if (grade.exam.sessionType === "retake") continue;

		const columnKey =
			grade.exam.class_course.code ??
			grade.exam.class_course.course.code ??
			grade.exam.class_course.course.name;
		if (!columnKey) continue;
		if (!courseGrades.has(columnKey)) {
			courseGrades.set(columnKey, []);
		}
		if (selectedExams.includes(grade.exam.id)) {
			// Use resolved grade (with retake logic applied)
			const resolved = resolvedGrades.get(grade.exam.id);
			if (resolved) {
				courseGrades.get(columnKey)?.push(resolved.score);
			}
		}
	}

	const courseAverages = new Map<string, number>();
	courseGrades.forEach((grades, course) => {
		if (grades.length > 0) {
			const average = grades.reduce((a, b) => a + b, 0) / grades.length;
			courseAverages.set(course, Number(average.toFixed(2)));
		}
	});
	return courseAverages;
}

/** Combined transcript ("relevé de notes"): one column per course average. */
export function exportTranscriptExcel({
	students,
	selectedExams,
	config,
	context,
	filename,
	t,
}: {
	students: StudentExport[];
	selectedExams: string[];
	config: ExportConfig;
	context: ExportContext;
	filename: string;
	t: TFunction;
}) {
	const headerRows = buildDocumentHeader(config, TITLE, context);

	const exportData = sortStudentsByName(students).map((student) => ({
		[t("admin.gradeExport.columns.lastName")]: student.last_name,
		[t("admin.gradeExport.columns.firstName")]: student.first_name,
		[t("admin.gradeExport.columns.registration")]: student.registration_number,
		[t("admin.gradeExport.columns.birthDate")]: student.birth_date
			? format(new Date(student.birth_date), "dd/MM/yyyy")
			: "",
		[t("admin.gradeExport.columns.birthPlace")]: student.birth_place || "",
		[t("admin.gradeExport.columns.gender")]: student.gender || "",
		...Object.fromEntries(courseAveragesOf(student, selectedExams)),
	}));

	// Create worksheet with header rows
	const ws = XLSX.utils.aoa_to_sheet(headerRows);
	XLSX.utils.sheet_add_json(ws, exportData, { origin: -1 });

	// Apply styling
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

	// Style institution name (row 0) - Bold, larger font, centered
	if (ws.A1) {
		ws.A1.s = {
			font: { bold: true, sz: 16 },
			alignment: { horizontal: "center", vertical: "center" },
		};
	}

	// Style faculty name (row 1) - Bold, centered
	if (ws.A2) {
		ws.A2.s = {
			font: { bold: true, sz: 14 },
			alignment: { horizontal: "center", vertical: "center" },
		};
	}

	// Style document title (find "RELEVÉ DE NOTES")
	for (let i = 0; i < headerRows.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
		if (ws[cellRef] && ws[cellRef].v === TITLE) {
			ws[cellRef].s = {
				font: { bold: true, sz: 18 },
				alignment: { horizontal: "center", vertical: "center" },
			};
		}
	}

	// Style info rows (Classe, Programme, etc.) - Bold labels
	for (let i = 0; i < headerRows.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
		if (ws[cellRef] && typeof ws[cellRef].v === "string") {
			if (isInfoRow(ws[cellRef].v)) {
				ws[cellRef].s = {
					font: { bold: true },
					alignment: { horizontal: "left" },
				};
			}
		}
	}

	// Style column headers (first data row after header) - Bold, background color
	const headerRowIndex = headerRows.length;
	for (let c = range.s.c; c <= range.e.c; c++) {
		const cellRef = XLSX.utils.encode_cell({
			r: headerRowIndex,
			c,
		});
		if (ws[cellRef]) {
			ws[cellRef].s = {
				font: { bold: true, color: { rgb: "FFFFFF" } },
				fill: { fgColor: { rgb: "4472C4" } },
				alignment: { horizontal: "center", vertical: "center" },
				border: {
					top: { style: "thin", color: { rgb: "000000" } },
					bottom: { style: "thin", color: { rgb: "000000" } },
					left: { style: "thin", color: { rgb: "000000" } },
					right: { style: "thin", color: { rgb: "000000" } },
				},
			};
		}
	}

	// Set column widths
	ws["!cols"] = [
		{ wch: 20 }, // Nom
		{ wch: 20 }, // Prénom
		{ wch: 15 }, // Matricule
		{ wch: 12 }, // Date naissance
		{ wch: 20 }, // Lieu naissance
		{ wch: 10 }, // Sexe
		...Array(range.e.c - 5).fill({ wch: 12 }), // Cours
	];

	// Merge cells for institution name and title
	ws["!merges"] = [
		{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(5, range.e.c) } }, // Institution
		{ s: { r: 1, c: 0 }, e: { r: 1, c: Math.min(5, range.e.c) } }, // Faculty
	];

	// Find and merge title row
	for (let i = 0; i < headerRows.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
		if (ws[cellRef] && ws[cellRef].v === TITLE) {
			ws["!merges"].push({
				s: { r: i, c: 0 },
				e: { r: i, c: Math.min(5, range.e.c) },
			});
			break;
		}
	}

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, t("admin.gradeExport.sheetName"));
	XLSX.writeFile(wb, filename);
}
