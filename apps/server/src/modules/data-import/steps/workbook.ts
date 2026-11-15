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

/** Range data validations: supported by ExcelJS but missing from its typings. */
type RangeValidations = ExcelJS.Worksheet & {
	dataValidations: {
		add: (range: string, rule: ExcelJS.DataValidation) => void;
	};
};
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

export function cellText(cell: ExcelJS.Cell): string {
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
			const letter = ws.getColumn(index + 1).letter;
			// One range rule (not per cell) so the sheet keeps its real row count
			(ws as RangeValidations).dataValidations.add(
				`${letter}2:${letter}${VALIDATED_ROWS}`,
				{
					type: "list",
					allowBlank: true,
					showErrorMessage: Boolean(col.enum),
					formulae: [formula],
				},
			);
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
				code: "missingSheet",
				params: { sheet: sheet.name },
				message: `Sheet "${sheet.name}" is missing: nothing is imported from it.`,
			});
			continue;
		}
		const headerIndex = new Map<string, number>();
		ws.getRow(1).eachCell((cell, index) => {
			headerIndex.set(normalize(cellText(cell)), index);
		});
		const columns = sheet.columns.map((col) => ({
			col,
			index: [col.header, ...(col.aliases ?? [])]
				.map((header) => headerIndex.get(normalize(header)))
				.find((index) => index !== undefined),
		}));
		for (const { col, index } of columns) {
			if (index === undefined && col.required)
				issues.push({
					sheet: sheet.name,
					row: 1,
					column: col.header,
					level: "error",
					code: "missingColumn",
					params: { column: col.header },
					message: `Required column "${col.header}" not found in the header.`,
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
				const issue = (code: string, message: string) => {
					invalid = true;
					issues.push({
						sheet: sheet.name,
						row: rowNumber,
						column: col.header,
						level: "error",
						code,
						params: { value, allowed: col.enum?.join(", ") ?? "" },
						message,
					});
				};
				if (!value) {
					if (col.required) issue("required", "Required value missing.");
					continue;
				}
				if (col.enum) {
					const match = col.enum.find((v) => normalize(v) === normalize(value));
					if (!match)
						issue(
							"enum",
							`"${value}" is not allowed (${col.enum.join(", ")}).`,
						);
					else values[col.key] = match;
				}
				if (col.type === "integer" && !/^-?\d+$/.test(value))
					issue("integer", `"${value}" must be a whole number.`);
				if (
					col.type === "number" &&
					Number.isNaN(Number(value.replace(",", ".")))
				)
					issue("number", `"${value}" must be a number.`);
				if (col.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
					issue("email", `"${value}" is not a valid email address.`);
				if (col.type === "date") {
					const date = parseDate(value);
					if (!date)
						issue(
							"date",
							`"${value}" is not a date (dd/mm/yyyy or yyyy-mm-dd).`,
						);
					else values[col.key] = date;
				}
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
				code: "duplicate",
				params: { row: first },
				message: `Duplicate: already on row ${first}.`,
			});
		else seen.set(k, row.row);
	}
	return issues;
}

/**
 * Reads a date written as dd/mm/yyyy (or dd-mm-yyyy, dd.mm.yyyy), yyyy-mm-dd
 * or an Excel serial number; returns yyyy-mm-dd, or null when it is not a date.
 */
export function parseDate(value: string): string | null {
	const text = value.trim();
	let y: number;
	let m: number;
	let d: number;
	const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
	const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
	if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
	else if (fr) [d, m, y] = [Number(fr[1]), Number(fr[2]), Number(fr[3])];
	else if (/^\d{4,5}(\.\d+)?$/.test(text)) {
		// Excel serial: days since 1899-12-30
		const date = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86400000);
		[y, m, d] = [
			date.getUTCFullYear(),
			date.getUTCMonth() + 1,
			date.getUTCDate(),
		];
	} else return null;
	const date = new Date(Date.UTC(y, m - 1, d));
	if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
	return date.toISOString().slice(0, 10);
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
