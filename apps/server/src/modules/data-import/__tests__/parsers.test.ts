import { describe, expect, it } from "bun:test";
import ExcelJS from "exceljs";
import { parseAcademicStructure } from "../parsers/academic-structure.parser";
import { parseEnrollments } from "../parsers/enrollments.parser";
import { parseGradesBulk } from "../parsers/grades-bulk.parser";
import { parsePeople } from "../parsers/people.parser";

async function makeBuffer(
	sheets: Record<string, (string | number)[][]>,
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	for (const [name, rows] of Object.entries(sheets)) {
		const ws = wb.addWorksheet(name);
		for (const row of rows) ws.addRow(row);
	}
	const { buffer } = (await wb.xlsx.writeBuffer()) as unknown as {
		buffer: Buffer;
	};
	return buffer;
}

describe("parseAcademicStructure", () => {
	it("parses valid programmes rows", async () => {
		const buf = await makeBuffer({
			Programmes: [
				["code", "nameFr", "nameEn", "studyCycleCode", "departmentCode"],
				["EXEMPLE", "exemple", "example", "BTS", "GINF"],
				["SIN", "Sciences Informatiques", "CS", "BTS", "GINF"],
			],
		});
		const result = await parseAcademicStructure(buf);
		expect(result.programmes).toHaveLength(1);
		expect(result.programmes[0].code).toBe("SIN");
		expect(result.errors).toHaveLength(0);
	});

	it("errors on missing code in Programmes", async () => {
		const buf = await makeBuffer({
			Programmes: [
				["code", "nameFr", "nameEn", "studyCycleCode"],
				["", "", "", ""],
				["", "Sciences Informatiques", "CS", "BTS"],
			],
		});
		const result = await parseAcademicStructure(buf);
		expect(result.errors.some((e) => e.col === "code")).toBe(true);
		expect(result.programmes).toHaveLength(0);
	});

	it("warns on missing studyCycleCode and skips row", async () => {
		const buf = await makeBuffer({
			Programmes: [
				["code", "nameFr", "nameEn", "studyCycleCode"],
				["", "", "", ""],
				["SIN", "Sciences Informatiques", "CS", ""],
			],
		});
		const result = await parseAcademicStructure(buf);
		expect(result.warnings.some((w) => w.col === "studyCycleCode")).toBe(true);
		expect(result.programmes).toHaveLength(0);
	});

	it("parses cours rows", async () => {
		const buf = await makeBuffer({
			Cours: [
				["code", "name", "teachingUnitCode", "credits", "coefficient"],
				["", "", "", "", ""],
				["ALGO1", "Algorithmique", "UE-ALGO", 3, 2],
			],
		});
		const result = await parseAcademicStructure(buf);
		expect(result.cours).toHaveLength(1);
		expect(result.cours[0].coefficient).toBe(2);
	});

	it("defaults coefficient to 1 when missing", async () => {
		const buf = await makeBuffer({
			Cours: [
				["code", "name", "teachingUnitCode", "credits", "coefficient"],
				["", "", "", "", ""],
				["ALGO1", "Algorithmique", "UE-ALGO", 3, ""],
			],
		});
		const result = await parseAcademicStructure(buf);
		expect(result.cours[0].coefficient).toBe(1);
	});
});

describe("parsePeople", () => {
	it("parses valid students", async () => {
		const buf = await makeBuffer({
			Étudiants: [
				[
					"firstName",
					"lastName",
					"email",
					"dateOfBirth",
					"gender",
					"phone",
					"nationality",
					"registrationNumber",
					"classCode",
					"academicYearCode",
				],
				["", "", "", "", "", "", "", "", "", ""],
				[
					"Jean",
					"Dupont",
					"jean@ex.com",
					"2002-01-01",
					"H",
					"",
					"CM",
					"ETU-001",
					"SIN-BTS1",
					"AY-2026",
				],
			],
		});
		const result = await parsePeople(buf);
		expect(result.students).toHaveLength(1);
		expect(result.students[0].email).toBe("jean@ex.com");
		expect(result.errors).toHaveLength(0);
	});

	it("errors on invalid email", async () => {
		const buf = await makeBuffer({
			Étudiants: [
				["firstName", "lastName", "email"],
				["", "", ""],
				["Jean", "Dupont", "not-an-email"],
			],
		});
		const result = await parsePeople(buf);
		expect(result.errors.some((e) => e.col === "email")).toBe(true);
	});

	it("warns when classCode given without academicYearCode", async () => {
		const buf = await makeBuffer({
			Étudiants: [
				[
					"firstName",
					"lastName",
					"email",
					"dateOfBirth",
					"gender",
					"phone",
					"nationality",
					"registrationNumber",
					"classCode",
					"academicYearCode",
				],
				["", "", "", "", "", "", "", "", "", ""],
				["Jean", "Dupont", "jean@ex.com", "", "", "", "", "", "SIN-BTS1", ""],
			],
		});
		const result = await parsePeople(buf);
		expect(result.warnings.some((w) => w.col === "academicYearCode")).toBe(
			true,
		);
		expect(result.students[0].classCode).toBeUndefined();
	});

	it("parses valid teachers", async () => {
		const buf = await makeBuffer({
			Enseignants: [
				[
					"firstName",
					"lastName",
					"email",
					"dateOfBirth",
					"gender",
					"phone",
					"specialty",
				],
				["", "", "", "", "", "", ""],
				[
					"Marie",
					"Curie",
					"m.curie@example.com",
					"1975-11-07",
					"F",
					"",
					"Math",
				],
			],
		});
		const result = await parsePeople(buf);
		expect(result.teachers).toHaveLength(1);
		expect(result.teachers[0].specialty).toBe("Math");
	});
});

describe("parseEnrollments", () => {
	it("parses valid enrollment rows", async () => {
		const buf = await makeBuffer({
			Inscriptions: [
				[
					"registrationNumber",
					"classCode",
					"academicYearCode",
					"admissionType",
				],
				["", "", "", ""],
				["ETU-001", "SIN-BTS1", "AY-2026", "normal"],
			],
		});
		const { rows, errors } = await parseEnrollments(buf);
		expect(rows).toHaveLength(1);
		expect(rows[0].classCode).toBe("SIN-BTS1");
		expect(errors).toHaveLength(0);
	});

	it("errors on missing registrationNumber", async () => {
		const buf = await makeBuffer({
			Inscriptions: [
				["registrationNumber", "classCode", "academicYearCode"],
				["", "", ""],
				["", "SIN-BTS1", "AY-2026"],
			],
		});
		const { errors } = await parseEnrollments(buf);
		expect(errors.some((e) => e.col === "registrationNumber")).toBe(true);
	});

	it("warns on unknown admissionType and defaults to normal", async () => {
		const buf = await makeBuffer({
			Inscriptions: [
				[
					"registrationNumber",
					"classCode",
					"academicYearCode",
					"admissionType",
				],
				["", "", "", ""],
				["ETU-001", "SIN-BTS1", "AY-2026", "invalide"],
			],
		});
		const { rows, warnings } = await parseEnrollments(buf);
		expect(warnings.some((w) => w.col === "admissionType")).toBe(true);
		expect(rows[0].admissionType).toBe("normal");
	});
});

describe("parseGradesBulk", () => {
	it("parses valid grade rows", async () => {
		const buf = await makeBuffer({
			Notes: [
				["examCode", "registrationNumber", "score"],
				["", "", ""],
				["CC-ALGO1", "ETU-001", 14.5],
			],
		});
		const { rows, errors } = await parseGradesBulk(buf);
		expect(rows).toHaveLength(1);
		expect(rows[0].score).toBe(14.5);
		expect(errors).toHaveLength(0);
	});

	it("errors on non-numeric score", async () => {
		const buf = await makeBuffer({
			Notes: [
				["examCode", "registrationNumber", "score"],
				["", "", ""],
				["CC-ALGO1", "ETU-001", "abc"],
			],
		});
		const { errors } = await parseGradesBulk(buf);
		expect(errors.some((e) => e.col === "score")).toBe(true);
	});

	it("warns on score out of range but keeps value", async () => {
		const buf = await makeBuffer({
			Notes: [
				["examCode", "registrationNumber", "score"],
				["", "", ""],
				["CC-ALGO1", "ETU-001", 25],
			],
		});
		const { rows, warnings } = await parseGradesBulk(buf);
		expect(rows[0].score).toBe(25);
		expect(warnings.some((w) => w.col === "score")).toBe(true);
	});
});
