import ExcelJS from "exceljs";
import type {
	ImportIssue,
	ImportStepDef,
	SheetRow,
	StepContext,
} from "./types";

const HEADER_FILL: ExcelJS.Fill = {
	type: "pattern",
	pattern: "solid",
	fgColor: { argb: "FF1E40AF" },
};
const REQUIRED_FILL: ExcelJS.Fill = {
	type: "pattern",
	pattern: "solid",
	fgColor: { argb: "FFB91C1C" },
};
const LISTS_SHEET = "Listes";
const VALIDATED_ROWS = 2000;

/** Accent/case/space-insensitive form used to match headers and enum values. */
export const normalize = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/\*/g, "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ");

function cellText(cell: ExcelJS.Cell): string {
	const value = cell.value;
	if (value === null || value === undefined) return "";
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	if (typeof value === "object") {
		if ("result" in value) return String(value.result ?? "").trim();
		if ("text" in value) return String(value.text ?? "").trim();
		if ("richText" in value)
			return value.richText
				.map((part) => part.text)
				.join("")
				.trim();
	}
	return String(value).trim();
}

/**
 * Builds the template of a step: one sheet per data sheet (required headers in
 * red, hints as notes), filled with the current data so a re-import updates it,
 * plus dropdowns for enums and for lists taken from the database.
 */
export async function buildTemplate(
	step: ImportStepDef,
	ctx: StepContext,
): Promise<Buffer> {
	const wb = new ExcelJS.Workbook();
	const [existing, lists] = await Promise.all([
		step.existingRows(ctx),
		step.lists?.(ctx) ?? Promise.resolve({} as Record<string, string[]>),
	]);

	const listNames = Object.keys(lists);
	for (const sheet of step.sheets) {
		const ws = wb.addWorksheet(sheet.name, {
			views: [{ state: "frozen", ySplit: 1 }],
		});
		ws.columns = sheet.columns.map((col) => ({
			header: col.required ? `${col.header} *` : col.header,
			key: col.key,
			width: col.width ?? Math.max(col.header.length + 6, 16),
		}));
		ws.getRow(1).eachCell((cell, index) => {
			const col = sheet.columns[index - 1];
			cell.fill = col.required ? REQUIRED_FILL : HEADER_FILL;
			cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
			const notes = [
				col.hint,
				col.enum ? `Valeurs : ${col.enum.join(", ")}` : undefined,
				col.required ? "Obligatoire" : "Facultatif",
			].filter(Boolean);
			cell.note = notes.join("\n");
		});
		for (const values of existing[sheet.name] ?? []) ws.addRow(values);

		sheet.columns.forEach((col, index) => {
			let formula: string | undefined;
			if (col.enum) formula = `"${col.enum.join(",")}"`;
			else if (col.listFrom && lists[col.listFrom]?.length) {
				const listCol = listNames.indexOf(col.listFrom) + 1;
				const letter = ws.getColumn(listCol).letter;
				formula = `${LISTS_SHEET}!$${letter}$2:$${letter}$${lists[col.listFrom].length + 1}`;
			}
			if (!formula) return;
			for (let r = 2; r <= VALIDATED_ROWS; r++) {
				ws.getCell(r, index + 1).dataValidation = {
					type: "list",
					allowBlank: true,
					showErrorMessage: Boolean(col.enum),
					formulae: [formula],
				};
			}
		});
	}

	if (listNames.length) {
		const ws = wb.addWorksheet(LISTS_SHEET, { state: "veryHidden" });
		ws.addRow(listNames);
		const longest = Math.max(...listNames.map((name) => lists[name].length));
		for (let i = 0; i < longest; i++)
			ws.addRow(listNames.map((name) => lists[name][i] ?? null));
	}

	const out = await wb.xlsx.writeBuffer();
	return Buffer.from(out as ArrayBuffer);
}

/**
 * Reads the sheets of a step from an uploaded workbook. Columns are matched by
 * header (accents, case and the required "*" are ignored); required cells,
 * enums and number types are checked here, references by the step's plan.
 */
export async function readWorkbook(
	step: ImportStepDef,
	buffer: Buffer,
): Promise<{ rows: Record<string, SheetRow[]>; issues: ImportIssue[] }> {
	const wb = new ExcelJS.Workbook();
	await wb.xlsx.load(buffer as unknown as ArrayBuffer);
	const rows: Record<string, SheetRow[]> = {};
	const issues: ImportIssue[] = [];

	for (const sheet of step.sheets) {
		rows[sheet.name] = [];
		const ws = wb.worksheets.find(
			(candidate) => normalize(candidate.name) === normalize(sheet.name),
		);
		if (!ws) {
			issues.push({
				sheet: sheet.name,
				row: 0,
				level: "warning",
				message: `Feuille « ${sheet.name} » absente du fichier : rien n'y sera importé.`,
			});
			continue;
		}
		const headerIndex = new Map<string, number>();
		ws.getRow(1).eachCell((cell, index) => {
			headerIndex.set(normalize(cellText(cell)), index);
		});
		const columns = sheet.columns.map((col) => ({
			col,
			index: headerIndex.get(normalize(col.header)),
		}));
		for (const { col, index } of columns) {
			if (index === undefined && col.required)
				issues.push({
					sheet: sheet.name,
					row: 1,
					column: col.header,
					level: "error",
					message: `Colonne obligatoire « ${col.header} » introuvable dans l'en-tête.`,
				});
		}

		ws.eachRow((row, rowNumber) => {
			if (rowNumber === 1) return;
			const values: Record<string, string> = {};
			for (const { col, index } of columns)
				values[col.key] = index ? cellText(row.getCell(index)) : "";
			if (Object.values(values).every((value) => !value)) return;

			let invalid = false;
			for (const { col } of columns) {
				const value = values[col.key];
				const issue = (message: string) => {
					invalid = true;
					issues.push({
						sheet: sheet.name,
						row: rowNumber,
						column: col.header,
						level: "error",
						message,
					});
				};
				if (!value) {
					if (col.required) issue("Valeur obligatoire manquante.");
					continue;
				}
				if (col.enum) {
					const match = col.enum.find((v) => normalize(v) === normalize(value));
					if (!match)
						issue(`« ${value} » n'est pas permis (${col.enum.join(", ")}).`);
					else values[col.key] = match;
				}
				if (col.type === "integer" && !/^-?\d+$/.test(value))
					issue(`« ${value} » doit être un nombre entier.`);
				if (
					col.type === "number" &&
					Number.isNaN(Number(value.replace(",", ".")))
				)
					issue(`« ${value} » doit être un nombre.`);
				if (col.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
					issue(`« ${value} » n'est pas une adresse e-mail valide.`);
			}
			rows[sheet.name].push({ row: rowNumber, values, invalid });
		});
	}
	return { rows, issues };
}

/** Flags rows whose key appears twice in the same sheet. */
export function findDuplicates(
	sheet: string,
	rows: SheetRow[],
	key: (row: SheetRow) => string,
	label: string,
): ImportIssue[] {
	const seen = new Map<string, number>();
	const issues: ImportIssue[] = [];
	for (const row of rows) {
		const k = normalize(key(row));
		if (!k) continue;
		const first = seen.get(k);
		if (first !== undefined)
			issues.push({
				sheet,
				row: row.row,
				column: label,
				level: "error",
				message: `Doublon : déjà présent ligne ${first}.`,
			});
		else seen.set(k, row.row);
	}
	return issues;
}

/** Rows of a sheet that carry no error. */
export const validRows = (
	sheet: string,
	rows: SheetRow[],
	issues: ImportIssue[],
) => {
	const bad = new Set(
		issues
			.filter((i) => i.sheet === sheet && i.level === "error")
			.map((i) => i.row),
	);
	return rows.filter((row) => !row.invalid && !bad.has(row.row));
};
