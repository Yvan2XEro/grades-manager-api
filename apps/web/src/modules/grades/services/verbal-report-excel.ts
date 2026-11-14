import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import type { RouterOutputs } from "@/utils/trpc";
import type { ExcelCell, ExcelRow, ExportClass } from "../types";
import { isInfoRow } from "./export-header";

export type PVData = RouterOutputs["exports"]["getPVData"];

/**
 * Verbal report ("procès-verbal") as Excel: stats block, then one column group
 * per UE (CC / EX / average per EC + UE average, credits, decision).
 */
export function exportVerbalReportExcel({
	pvData,
	classData,
	hasContext,
	filename,
	t,
}: {
	pvData: PVData;
	classData?: ExportClass;
	/** A class, semester or year is known: the info rows are printed. */
	hasContext: boolean;
	filename: string;
	t: TFunction;
}) {
	const ues: Array<{
		code: string;
		name: string;
		credits: number;
		courses: Array<{
			name: string;
			code: string;
			coefficient: number;
		}>;
	}> = pvData.ues ?? [];

	// Build column layout: Rang | Matricule | Nom | [per UE: per EC(CC,EX,Moy) | Moy UE | Crédits | Décision] | Moy Gén | Total Crédits | Décision
	// First header row: UE names spanning their courses
	// Second header row: EC names/details

	// Count total columns per UE: each course has 3 cols (CC, EX, Moy) + 3 for UE summary (Avg, Credits, Decision)
	const fixedCols = 3; // Rang, Matricule, Nom
	const trailingCols = 3; // Moy Générale, Total Crédits, Décision

	const firstHeaderRow: ExcelCell[] = [
		t("admin.gradeExport.pv.table.rank"),
		t("admin.gradeExport.columns.registration"),
		t("admin.gradeExport.pv.table.fullName"),
	];
	const secondHeaderRow: ExcelCell[] = ["", "", ""];

	for (const ue of ues) {
		const courseCols = ue.courses.length * 3; // CC, EX, Moy per course
		const ueTotalCols = courseCols + 3; // + Moy UE, Crédits, Décision
		firstHeaderRow.push(
			`${ue.name} (${ue.code}) [${ue.credits} cr.]`,
			...Array(ueTotalCols - 1).fill(""),
		);
		for (const course of ue.courses) {
			secondHeaderRow.push(
				`${course.name} CC`,
				`${course.name} EX`,
				`Moy (×${course.coefficient})`,
			);
		}
		secondHeaderRow.push("Moy UE", "Crédits", "Décision");
	}

	firstHeaderRow.push(
		t("admin.gradeExport.pv.table.average"),
		"Total Crédits",
		"Décision",
	);
	secondHeaderRow.push("", "", "");

	// Data rows
	const tableRows: ExcelRow[] = [];
	const averages: number[] = [];

	for (const [index, student] of pvData.students.entries()) {
		const row: ExcelRow = [
			student.number ?? index + 1,
			student.registrationNumber,
			`${student.lastName} ${student.firstName}`,
		];

		for (const ueGrade of student.ueGrades) {
			for (const cg of ueGrade.courseGrades) {
				row.push(
					cg.cc !== null && cg.cc !== undefined
						? Number(Number(cg.cc).toFixed(2))
						: "",
					cg.ex !== null && cg.ex !== undefined
						? Number(Number(cg.ex).toFixed(2))
						: "",
					cg.average !== null && cg.average !== undefined
						? Number(Number(cg.average).toFixed(2))
						: "",
				);
			}
			row.push(
				ueGrade.average !== null && ueGrade.average !== undefined
					? Number(Number(ueGrade.average).toFixed(2))
					: "",
				ueGrade.credits ?? 0,
				ueGrade.decision ?? "",
			);
		}

		row.push(
			student.generalAverage !== null && student.generalAverage !== undefined
				? Number(Number(student.generalAverage).toFixed(2))
				: "",
			student.totalCredits ?? 0,
			student.overallDecision ?? "",
		);

		tableRows.push(row);
		if (typeof student.generalAverage === "number") {
			averages.push(student.generalAverage);
		}
	}

	// Stats
	const totalStudents = pvData.students.length;
	const validated = pvData.students.filter(
		(s: any) => s.overallDecision === "VALIDÉ",
	).length;
	const nonValidated = totalStudents - validated;
	const successRate = pvData.globalSuccessRate ?? 0;
	const promotionAverage =
		averages.length > 0
			? averages.reduce((sum, avg) => sum + avg, 0) / averages.length
			: null;

	const statsRows: ExcelRow[] = [
		[t("admin.gradeExport.pv.stats.title")],
		[t("admin.gradeExport.pv.stats.students"), totalStudents],
		[t("admin.gradeExport.pv.stats.validated"), validated],
		[t("admin.gradeExport.pv.stats.notValidated"), nonValidated],
		[t("admin.gradeExport.pv.stats.successRate"), `${successRate}%`],
		[
			t("admin.gradeExport.pv.stats.average"),
			promotionAverage !== null ? promotionAverage.toFixed(2) : "-",
		],
	];

	// Institution header
	const institutionHeader: ExcelRow[] = [];
	if (pvData.name_fr) {
		institutionHeader.push([pvData.name_fr]);
	}
	if (pvData.faculty_name_fr) {
		institutionHeader.push([pvData.faculty_name_fr]);
	}
	institutionHeader.push([""]);
	institutionHeader.push(["PROCÈS-VERBAL DES RÉSULTATS"]);
	institutionHeader.push([""]);

	if (hasContext) {
		if (classData) institutionHeader.push([`Classe: ${classData.name}`]);
		if (classData?.program)
			institutionHeader.push([`Programme: ${classData.program.name}`]);
		if (pvData.semester)
			institutionHeader.push([`Semestre: ${pvData.semester}`]);
		if (pvData.academicYear)
			institutionHeader.push([`Année Académique: ${pvData.academicYear}`]);
		institutionHeader.push([""]);
	}

	const aoa: ExcelRow[] = [
		...institutionHeader,
		...statsRows,
		[""],
		[t("admin.gradeExport.pv.table.title")],
		firstHeaderRow,
		secondHeaderRow,
		...tableRows,
	];

	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const headerRow1Index = institutionHeader.length + statsRows.length + 1;
	const headerRow2Index = headerRow1Index + 1;
	const merges: XLSX.Range[] = [];
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
	const totalDataCols = (secondHeaderRow as ExcelCell[]).length;

	// Merge fixed columns across both header rows
	for (const colIdx of [0, 1, 2]) {
		merges.push({
			s: { r: headerRow1Index, c: colIdx },
			e: { r: headerRow2Index, c: colIdx },
		});
	}

	// Merge UE header spans and trailing columns
	let colOffset = fixedCols;
	for (const ue of ues) {
		const ueCols = ue.courses.length * 3 + 3;
		merges.push({
			s: { r: headerRow1Index, c: colOffset },
			e: { r: headerRow1Index, c: colOffset + ueCols - 1 },
		});
		colOffset += ueCols;
	}
	// Merge trailing columns (Moy Gén, Total Crédits, Décision)
	for (let i = 0; i < trailingCols; i++) {
		merges.push({
			s: { r: headerRow1Index, c: colOffset + i },
			e: { r: headerRow2Index, c: colOffset + i },
		});
	}

	// Institution header merges and styling
	if (ws.A1) {
		ws.A1.s = {
			font: { bold: true, sz: 16 },
			alignment: { horizontal: "center", vertical: "center" },
		};
		merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } });
	}
	if (ws.A2) {
		ws.A2.s = {
			font: { bold: true, sz: 14 },
			alignment: { horizontal: "center", vertical: "center" },
		};
		merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: range.e.c } });
	}

	// Style document title and info rows
	for (let i = 0; i < institutionHeader.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
		if (ws[cellRef] && ws[cellRef].v === "PROCÈS-VERBAL DES RÉSULTATS") {
			ws[cellRef].s = {
				font: { bold: true, sz: 18 },
				alignment: { horizontal: "center", vertical: "center" },
			};
			merges.push({ s: { r: i, c: 0 }, e: { r: i, c: range.e.c } });
		}
		if (ws[cellRef] && typeof ws[cellRef].v === "string") {
			const value = ws[cellRef].v;
			if (isInfoRow(value)) {
				ws[cellRef].s = {
					font: { bold: true },
					alignment: { horizontal: "left" },
				};
			}
		}
	}

	// Stats styling
	const statsStartRow = institutionHeader.length;
	const statsTitleRef = XLSX.utils.encode_cell({ r: statsStartRow, c: 0 });
	if (ws[statsTitleRef]) {
		ws[statsTitleRef].s = {
			font: { bold: true, sz: 14 },
			fill: { fgColor: { rgb: "E7E6E6" } },
			alignment: { horizontal: "center", vertical: "center" },
		};
	}
	for (let i = 1; i < statsRows.length; i++) {
		const cellRef = XLSX.utils.encode_cell({ r: statsStartRow + i, c: 0 });
		if (ws[cellRef]) {
			ws[cellRef].s = { font: { bold: true } };
		}
	}

	// Table title
	const tableTitleRow = institutionHeader.length + statsRows.length + 1;
	const tableTitleRef = XLSX.utils.encode_cell({ r: tableTitleRow, c: 0 });
	if (ws[tableTitleRef]) {
		ws[tableTitleRef].s = {
			font: { bold: true, sz: 14 },
			fill: { fgColor: { rgb: "E7E6E6" } },
			alignment: { horizontal: "center", vertical: "center" },
		};
	}

	// Header row styling
	for (let c = 0; c <= range.e.c; c++) {
		const cellRef1 = XLSX.utils.encode_cell({ r: headerRow1Index, c });
		if (ws[cellRef1]) {
			ws[cellRef1].s = {
				font: { bold: true, color: { rgb: "FFFFFF" } },
				fill: { fgColor: { rgb: "4472C4" } },
				alignment: {
					horizontal: "center",
					vertical: "center",
					wrapText: true,
				},
				border: {
					top: { style: "thin", color: { rgb: "000000" } },
					bottom: { style: "thin", color: { rgb: "000000" } },
					left: { style: "thin", color: { rgb: "000000" } },
					right: { style: "thin", color: { rgb: "000000" } },
				},
			};
		}
		const cellRef2 = XLSX.utils.encode_cell({ r: headerRow2Index, c });
		if (ws[cellRef2]) {
			ws[cellRef2].s = {
				font: { bold: true, color: { rgb: "FFFFFF" } },
				fill: { fgColor: { rgb: "5B9BD5" } },
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

	// Data row styling
	const dataStartRow = headerRow2Index + 1;
	const dataEndRow = dataStartRow + tableRows.length - 1;
	for (let r = dataStartRow; r <= dataEndRow; r++) {
		for (let c = 0; c <= range.e.c; c++) {
			const cellRef = XLSX.utils.encode_cell({ r, c });
			if (ws[cellRef]) {
				ws[cellRef].s = {
					alignment: { horizontal: "center", vertical: "center" },
					border: {
						top: { style: "thin", color: { rgb: "D0D0D0" } },
						bottom: { style: "thin", color: { rgb: "D0D0D0" } },
						left: { style: "thin", color: { rgb: "D0D0D0" } },
						right: { style: "thin", color: { rgb: "D0D0D0" } },
					},
				};
				if ((r - dataStartRow) % 2 === 1) {
					ws[cellRef].s.fill = { fgColor: { rgb: "F2F2F2" } };
				}
			}
		}
	}

	// Column widths
	ws["!cols"] = [
		{ wch: 6 }, // Rang
		{ wch: 14 }, // Matricule
		{ wch: 22 }, // Nom
		...Array(totalDataCols - fixedCols - trailingCols).fill({ wch: 8 }),
		{ wch: 10 }, // Moy Gén
		{ wch: 10 }, // Total Crédits
		{ wch: 12 }, // Décision
	];

	ws["!merges"] = merges;
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, t("admin.gradeExport.pv.sheetName"));
	XLSX.writeFile(wb, filename);
}
