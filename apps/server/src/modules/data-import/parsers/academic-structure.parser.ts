import ExcelJS from "exceljs";

export type ParseError = { row: number; col?: string; message: string };
export type ParseWarning = { row: number; col?: string; message: string };

export type ProgrammeRow = {
	code: string;
	nameFr: string;
	nameEn?: string;
	studyCycleCode: string;
	departmentCode?: string;
	durationYears?: number;
	totalCredits?: number;
};
export type CoursRow = {
	code: string;
	name: string;
	teachingUnitCode: string;
	credits?: number;
	coefficient?: number;
};
export type ClasseRow = {
	code: string;
	name: string;
	programCode: string;
	programOptionCode?: string;
	cycleLevelCode?: string;
	semesterCode?: string;
	academicYearCode: string;
};
export type AcademicStructureRows = {
	programmes: ProgrammeRow[];
	cours: CoursRow[];
	classes: ClasseRow[];
	errors: ParseError[];
	warnings: ParseWarning[];
};

function cell(row: ExcelJS.Row, col: number): string {
	const v = row.getCell(col).value;
	return v == null ? "" : String(v).trim();
}
function num(row: ExcelJS.Row, col: number): number | undefined {
	const v = row.getCell(col).value;
	const n = Number(v);
	return Number.isNaN(n) || v == null || v === "" ? undefined : n;
}

export async function parseAcademicStructure(
	buffer: Buffer | Uint8Array,
): Promise<AcademicStructureRows> {
	const wb = new ExcelJS.Workbook();
	// ExcelJS defines its own Buffer interface (extends ArrayBuffer) which is
	// incompatible with Node.js Buffer<ArrayBufferLike> at the type level only.
	// Runtime accepts Node.js Buffer just fine.
	// biome-ignore lint/suspicious/noExplicitAny: ExcelJS Buffer type mismatch
	await wb.xlsx.load(buffer as any);

	const errors: ParseError[] = [];
	const warnings: ParseWarning[] = [];
	const programmes: ProgrammeRow[] = [];
	const cours: CoursRow[] = [];
	const classes: ClasseRow[] = [];

	// Sheet: Programmes — skip row 1 (header) and row 2 (example)
	const wsProg = wb.getWorksheet("Programmes");
	if (wsProg) {
		wsProg.eachRow((row, rowNum) => {
			if (rowNum <= 2) return;
			const code = cell(row, 1);
			const nameFr = cell(row, 2);
			const studyCycleCode = cell(row, 4);
			if (!code) {
				errors.push({ row: rowNum, col: "code", message: "code requis" });
				return;
			}
			if (!nameFr) {
				errors.push({ row: rowNum, col: "nameFr", message: "nameFr requis" });
				return;
			}
			if (!studyCycleCode) {
				warnings.push({
					row: rowNum,
					col: "studyCycleCode",
					message: "studyCycleCode manquant — ligne ignorée",
				});
				return;
			}
			programmes.push({
				code,
				nameFr,
				nameEn: cell(row, 3) || undefined,
				studyCycleCode,
				departmentCode: cell(row, 5) || undefined,
				durationYears: num(row, 6),
				totalCredits: num(row, 7),
			});
		});
	}

	// Sheet: Cours
	const wsCours = wb.getWorksheet("Cours");
	if (wsCours) {
		wsCours.eachRow((row, rowNum) => {
			if (rowNum <= 2) return;
			const code = cell(row, 1);
			const name = cell(row, 2);
			const teachingUnitCode = cell(row, 3);
			if (!code) {
				errors.push({ row: rowNum, col: "code", message: "code requis" });
				return;
			}
			if (!name) {
				errors.push({ row: rowNum, col: "name", message: "name requis" });
				return;
			}
			if (!teachingUnitCode) {
				warnings.push({
					row: rowNum,
					col: "teachingUnitCode",
					message: "teachingUnitCode manquant",
				});
				return;
			}
			const coefficient = num(row, 5);
			cours.push({
				code,
				name,
				teachingUnitCode,
				credits: num(row, 4),
				coefficient: coefficient == null ? 1 : coefficient,
			});
		});
	}

	// Sheet: Classes
	const wsClasses = wb.getWorksheet("Classes");
	if (wsClasses) {
		wsClasses.eachRow((row, rowNum) => {
			if (rowNum <= 2) return;
			const code = cell(row, 1);
			const name = cell(row, 2);
			const programCode = cell(row, 3);
			const academicYearCode = cell(row, 7);
			if (!code) {
				errors.push({ row: rowNum, col: "code", message: "code requis" });
				return;
			}
			if (!programCode) {
				errors.push({
					row: rowNum,
					col: "programCode",
					message: "programCode requis",
				});
				return;
			}
			if (!academicYearCode) {
				errors.push({
					row: rowNum,
					col: "academicYearCode",
					message: "academicYearCode requis",
				});
				return;
			}
			classes.push({
				code,
				name: name || code,
				programCode,
				programOptionCode: cell(row, 4) || undefined,
				cycleLevelCode: cell(row, 5) || undefined,
				semesterCode: cell(row, 6) || undefined,
				academicYearCode,
			});
		});
	}

	return { programmes, cours, classes, errors, warnings };
}
