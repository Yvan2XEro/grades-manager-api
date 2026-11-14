import * as XLSX from "xlsx";

export type ParsedRow = { reference: string; amount: number; date: string };

export function parseCSV(raw: string): ParsedRow[] {
	return raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter(
			(line) =>
				!line.startsWith("#") && !line.toLowerCase().startsWith("reference"),
		)
		.map((line) => {
			const parts = line.split(/[,;\t]/);
			const reference = parts[0]?.trim() ?? "";
			const amount = Number.parseFloat(
				(parts[1] ?? "").trim().replace(/\s/g, ""),
			);
			const date = (parts[2] ?? "").trim();
			return { reference, amount, date };
		})
		.filter(
			(r) =>
				r.reference.length > 0 &&
				!Number.isNaN(r.amount) &&
				r.amount > 0 &&
				/^\d{4}-\d{2}-\d{2}$/.test(r.date),
		);
}

function xlsxDateToISO(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === "number") {
		// Excel serial date
		const d = XLSX.SSF.parse_date_code(value);
		if (d) {
			const month = String(d.m).padStart(2, "0");
			const day = String(d.d).padStart(2, "0");
			return `${d.y}-${month}-${day}`;
		}
	}
	if (typeof value === "string") {
		// Try ISO or DD/MM/YYYY
		const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (iso) return value;
		const fr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
		if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
	}
	return "";
}

export function parseXLSX(buffer: ArrayBuffer): ParsedRow[] {
	const wb = XLSX.read(buffer, { type: "array", cellDates: true });
	const ws = wb.Sheets[wb.SheetNames[0]];
	if (!ws) return [];
	const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
		header: 1,
		defval: "",
	}) as unknown[][];

	return rows
		.slice(1) // skip header
		.map((row) => {
			const reference = String(row[0] ?? "").trim();
			const rawAmount = row[1];
			const amount = Number.parseFloat(
				String(rawAmount ?? "")
					.trim()
					.replace(/\s/g, ""),
			);
			const date = xlsxDateToISO(row[2]);
			return { reference, amount, date };
		})
		.filter(
			(r) =>
				r.reference.length > 0 &&
				!Number.isNaN(r.amount) &&
				r.amount > 0 &&
				/^\d{4}-\d{2}-\d{2}$/.test(r.date),
		);
}
