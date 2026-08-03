import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type EnrollmentRow = {
	registrationNumber: string;
	classCode: string;
	academicYearCode: string;
	admissionType?: string;
	transferInstitution?: string;
	transferCredits?: number;
};

const VALID_ADMISSION_TYPES = ["normal", "transfer", "direct"];

function cell(row: ExcelJS.Row, col: number): string {
	const v = row.getCell(col).value;
	return v == null ? "" : String(v).trim();
}

export async function parseEnrollments(buffer: Buffer | Uint8Array): Promise<{
	rows: EnrollmentRow[];
	errors: ParseError[];
	warnings: ParseWarning[];
}> {
	const wb = new ExcelJS.Workbook();
	// biome-ignore lint/suspicious/noExplicitAny: ExcelJS Buffer type mismatch
	await wb.xlsx.load(buffer as any);
	const ws = wb.getWorksheet("Inscriptions") ?? wb.worksheets[0];
	const errors: ParseError[] = [];
	const warnings: ParseWarning[] = [];
	const rows: EnrollmentRow[] = [];

	if (!ws) {
		return {
			rows,
			errors: [{ row: 0, message: "Aucune feuille trouvée" }],
			warnings,
		};
	}

	ws.eachRow((row, rowNum) => {
		if (rowNum <= 2) return;
		const registrationNumber = cell(row, 1);
		const classCode = cell(row, 2);
		const academicYearCode = cell(row, 3);
		if (!registrationNumber) {
			errors.push({
				row: rowNum,
				col: "registrationNumber",
				message: "requis",
			});
			return;
		}
		if (!classCode) {
			errors.push({ row: rowNum, col: "classCode", message: "requis" });
			return;
		}
		if (!academicYearCode) {
			errors.push({
				row: rowNum,
				col: "academicYearCode",
				message: "requis",
			});
			return;
		}
		const admissionType = cell(row, 4) || "normal";
		if (!VALID_ADMISSION_TYPES.includes(admissionType)) {
			warnings.push({
				row: rowNum,
				col: "admissionType",
				message: `valeur inconnue "${admissionType}" — "normal" utilisé`,
			});
		}
		const creditsRaw = row.getCell(6).value;
		const transferCredits =
			creditsRaw == null || creditsRaw === "" ? undefined : Number(creditsRaw);
		rows.push({
			registrationNumber,
			classCode,
			academicYearCode,
			admissionType: VALID_ADMISSION_TYPES.includes(admissionType)
				? admissionType
				: "normal",
			transferInstitution: cell(row, 5) || undefined,
			transferCredits: Number.isNaN(transferCredits)
				? undefined
				: transferCredits,
		});
	});

	return { rows, errors, warnings };
}
