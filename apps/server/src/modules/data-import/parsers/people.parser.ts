import ExcelJS from "exceljs";
import type { ParseError, ParseWarning } from "./academic-structure.parser";

export type StudentRow = {
	firstName: string;
	lastName: string;
	email: string;
	dateOfBirth?: string;
	gender?: string;
	phone?: string;
	nationality?: string;
	registrationNumber?: string;
	classCode?: string;
	academicYearCode?: string;
};
export type TeacherRow = {
	firstName: string;
	lastName: string;
	email: string;
	dateOfBirth?: string;
	gender?: string;
	phone?: string;
	specialty?: string;
};
export type PeopleRows = {
	students: StudentRow[];
	teachers: TeacherRow[];
	errors: ParseError[];
	warnings: ParseWarning[];
};

function cell(row: ExcelJS.Row, col: number): string {
	const v = row.getCell(col).value;
	return v == null ? "" : String(v).trim();
}

function isValidEmail(s: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function parsePeople(
	buffer: Buffer | Uint8Array,
): Promise<PeopleRows> {
	const wb = new ExcelJS.Workbook();
	// biome-ignore lint/suspicious/noExplicitAny: ExcelJS Buffer type mismatch
	await wb.xlsx.load(buffer as any);
	const errors: ParseError[] = [];
	const warnings: ParseWarning[] = [];
	const students: StudentRow[] = [];
	const teachers: TeacherRow[] = [];

	const wsEtu = wb.getWorksheet("Étudiants");
	if (wsEtu) {
		wsEtu.eachRow((row, rowNum) => {
			if (rowNum <= 2) return;
			const firstName = cell(row, 1);
			const lastName = cell(row, 2);
			const email = cell(row, 3);
			if (!firstName || !lastName) {
				errors.push({
					row: rowNum,
					message: "firstName et lastName requis",
				});
				return;
			}
			if (!email || !isValidEmail(email)) {
				errors.push({
					row: rowNum,
					col: "email",
					message: `email invalide: "${email}"`,
				});
				return;
			}
			const classCode = cell(row, 9) || undefined;
			const academicYearCode = cell(row, 10) || undefined;
			if (classCode && !academicYearCode) {
				warnings.push({
					row: rowNum,
					col: "academicYearCode",
					message:
						"classCode fourni sans academicYearCode — inscription ignorée",
				});
			}
			const hasEnrollmentInfo = classCode && academicYearCode;
			students.push({
				firstName,
				lastName,
				email,
				dateOfBirth: cell(row, 4) || undefined,
				gender: cell(row, 5) || undefined,
				phone: cell(row, 6) || undefined,
				nationality: cell(row, 7) || undefined,
				registrationNumber: cell(row, 8) || undefined,
				classCode: hasEnrollmentInfo ? classCode : undefined,
				academicYearCode: hasEnrollmentInfo ? academicYearCode : undefined,
			});
		});
	}

	const wsEnseig = wb.getWorksheet("Enseignants");
	if (wsEnseig) {
		wsEnseig.eachRow((row, rowNum) => {
			if (rowNum <= 2) return;
			const firstName = cell(row, 1);
			const lastName = cell(row, 2);
			const email = cell(row, 3);
			if (!firstName || !lastName) {
				errors.push({
					row: rowNum,
					message: "firstName et lastName requis",
				});
				return;
			}
			if (!email || !isValidEmail(email)) {
				errors.push({
					row: rowNum,
					col: "email",
					message: `email invalide: "${email}"`,
				});
				return;
			}
			teachers.push({
				firstName,
				lastName,
				email,
				dateOfBirth: cell(row, 4) || undefined,
				gender: cell(row, 5) || undefined,
				phone: cell(row, 6) || undefined,
				specialty: cell(row, 7) || undefined,
			});
		});
	}

	return { students, teachers, errors, warnings };
}
