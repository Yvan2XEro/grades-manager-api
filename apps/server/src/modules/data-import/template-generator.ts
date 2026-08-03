import ExcelJS from "exceljs";

export type ImportTemplateType =
	| "academic-structure"
	| "people"
	| "enrollments"
	| "grades-bulk";

const HEADER_FILL: ExcelJS.Fill = {
	type: "pattern",
	pattern: "solid",
	fgColor: { argb: "FF1E40AF" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
	bold: true,
	color: { argb: "FFFFFFFF" },
};
const EXAMPLE_FONT: Partial<ExcelJS.Font> = {
	italic: true,
	color: { argb: "FF9CA3AF" },
};

function addHeaderRow(ws: ExcelJS.Worksheet, columns: string[]) {
	ws.columns = columns.map((c) => ({
		header: c,
		key: c,
		width: Math.max(c.length + 4, 18),
	}));
	const headerRow = ws.getRow(1);
	headerRow.eachCell((cell) => {
		cell.fill = HEADER_FILL;
		cell.font = HEADER_FONT;
	});
}

function addExampleRow(ws: ExcelJS.Worksheet, values: (string | number)[]) {
	const row = ws.addRow(values);
	row.eachCell((cell) => {
		cell.font = EXAMPLE_FONT;
	});
}

function addEnumValidation(
	ws: ExcelJS.Worksheet,
	col: number,
	startRow: number,
	values: string[],
) {
	for (let r = startRow; r <= startRow + 500; r++) {
		ws.getCell(r, col).dataValidation = {
			type: "list",
			allowBlank: true,
			formulae: [`"${values.join(",")}"`],
		};
	}
}

async function buildAcademicStructureTemplate(): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const wsProg = wb.addWorksheet("Programmes");
	addHeaderRow(wsProg, [
		"code",
		"nameFr",
		"nameEn",
		"studyCycleCode",
		"departmentCode",
		"durationYears",
		"totalCredits",
	]);
	addExampleRow(wsProg, [
		"SIN",
		"Sciences Informatiques",
		"Computer Science",
		"BTS",
		"GINF",
		2,
		120,
	]);
	wsProg.getCell("A2").note =
		'Formule suggérée: =UPPER(LEFT(SUBSTITUTE(B2," ",""),4))';

	const wsCours = wb.addWorksheet("Cours");
	addHeaderRow(wsCours, [
		"code",
		"name",
		"teachingUnitCode",
		"credits",
		"coefficient",
	]);
	addExampleRow(wsCours, ["ALGO1", "Algorithmique", "UE-ALGO", 3, 2]);

	const wsClasses = wb.addWorksheet("Classes");
	addHeaderRow(wsClasses, [
		"code",
		"name",
		"programCode",
		"programOptionCode",
		"cycleLevelCode",
		"semesterCode",
		"academicYearName",
	]);
	addExampleRow(wsClasses, [
		"SIN-BTS1-2026",
		"SIN BTS1 2025-2026",
		"SIN",
		"GEN",
		"BTS1",
		"S1",
		"2025-2026",
	]);

	const wsRef = wb.addWorksheet("Références");
	wsRef.state = "hidden";
	wsRef.addRow([
		"[Codes académiques de votre institution — rempli dynamiquement]",
	]);

	const { buffer } = (await wb.xlsx.writeBuffer()) as unknown as {
		buffer: Buffer;
	};
	return buffer;
}

async function buildPeopleTemplate(): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();

	const wsEtu = wb.addWorksheet("Étudiants");
	addHeaderRow(wsEtu, [
		"firstName",
		"lastName",
		"email",
		"dateOfBirth",
		"gender",
		"phone",
		"nationality",
		"registrationNumber",
		"classCode",
		"academicYearName",
	]);
	addExampleRow(wsEtu, [
		"Jean",
		"Dupont",
		"jean.dupont@example.com",
		"2002-03-15",
		"H",
		"+237600000001",
		"Camerounaise",
		"ETU-2026-001",
		"SIN-BTS1-2026",
		"2025-2026",
	]);
	addEnumValidation(wsEtu, 5, 3, ["H", "F"]);

	const wsEnseig = wb.addWorksheet("Enseignants");
	addHeaderRow(wsEnseig, [
		"firstName",
		"lastName",
		"email",
		"dateOfBirth",
		"gender",
		"phone",
		"specialty",
	]);
	addExampleRow(wsEnseig, [
		"Marie",
		"Curie",
		"m.curie@example.com",
		"1975-11-07",
		"F",
		"+237600000002",
		"Mathématiques",
	]);
	addEnumValidation(wsEnseig, 5, 3, ["H", "F"]);

	const wsRef = wb.addWorksheet("Références");
	wsRef.state = "hidden";
	wsRef.addRow(["Codes classes et années académiques de votre institution"]);

	const { buffer } = (await wb.xlsx.writeBuffer()) as unknown as {
		buffer: Buffer;
	};
	return buffer;
}

async function buildEnrollmentsTemplate(): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet("Inscriptions");
	addHeaderRow(ws, [
		"registrationNumber",
		"classCode",
		"academicYearName",
		"admissionType",
		"transferInstitution",
		"transferCredits",
	]);
	addExampleRow(ws, [
		"ETU-2026-001",
		"SIN-BTS1-2026",
		"2025-2026",
		"normal",
		"",
		"",
	]);
	addEnumValidation(ws, 4, 3, ["normal", "transfer", "direct"]);

	const { buffer } = (await wb.xlsx.writeBuffer()) as unknown as {
		buffer: Buffer;
	};
	return buffer;
}

async function buildGradesBulkTemplate(): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet("Notes");
	addHeaderRow(ws, ["examName", "registrationNumber", "score"]);
	addExampleRow(ws, ["CC Algorithmique BTS1-S1", "ETU-2026-001", 14.5]);

	const { buffer } = (await wb.xlsx.writeBuffer()) as unknown as {
		buffer: Buffer;
	};
	return buffer;
}

export async function generateImportTemplate(
	type: ImportTemplateType,
): Promise<Buffer> {
	switch (type) {
		case "academic-structure":
			return buildAcademicStructureTemplate();
		case "people":
			return buildPeopleTemplate();
		case "enrollments":
			return buildEnrollmentsTemplate();
		case "grades-bulk":
			return buildGradesBulkTemplate();
	}
}
