import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type GradeRow = {
	examCode: string;
	registrationNumber: string;
	score: number;
};

function cell(row: ExcelJS.Row, col: number): string {
	const v = row.getCell(col).value;
	return v == null ? "" : String(v).trim();
}

export async function parseGradesBulk(buffer: Buffer | Uint8Array): Promise<{
	rows: GradeRow[];
	errors: ParseError[];
	warnings: ParseWarning[];
}> {
	const wb = new ExcelJS.Workbook();
	// biome-ignore lint/suspicious/noExplicitAny: ExcelJS Buffer type mismatch
	await wb.xlsx.load(buffer as any);
	const ws = wb.getWorksheet("Notes") ?? wb.worksheets[0];
	const errors: ParseError[] = [];
	const warnings: ParseWarning[] = [];
	const rows: GradeRow[] = [];

	if (!ws) {
		return {
			rows,
			errors: [{ row: 0, message: "Feuille 'Notes' introuvable" }],
			warnings,
		};
	}

	ws.eachRow((row, rowNum) => {
		if (rowNum <= 2) return;
		const examCode = cell(row, 1);
		const registrationNumber = cell(row, 2);
		const scoreRaw = row.getCell(3).value;
		if (!examCode) {
			errors.push({ row: rowNum, col: "examCode", message: "requis" });
			return;
		}
		if (!registrationNumber) {
			errors.push({
				row: rowNum,
				col: "registrationNumber",
				message: "requis",
			});
			return;
		}
		const score = Number(scoreRaw);
		if (Number.isNaN(score)) {
			errors.push({
				row: rowNum,
				col: "score",
				message: `score invalide: "${scoreRaw}"`,
			});
			return;
		}
		if (score < 0 || score > 20) {
			warnings.push({
				row: rowNum,
				col: "score",
				message: `score ${score} hors plage [0,20] — valeur conservée`,
			});
		}
		rows.push({ examCode, registrationNumber, score });
	});

	return { rows, errors, warnings };
}
