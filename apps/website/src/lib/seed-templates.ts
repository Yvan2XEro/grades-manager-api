import * as XLSX from "xlsx";
import * as yaml from "yaml";

// ─── Template definitions ─────────────────────────────────────────────────────

export type TemplateType = "structure" | "programmes" | "equipe";

type SheetDef = {
	name: string;
	headers: string[];
	examples: string[][];
	note: string;
};

const SHEET_DEFS: Record<TemplateType, SheetDef[]> = {
	structure: [
		{
			name: "Faculties",
			headers: ["code *", "name *", "description"],
			examples: [
				["SCI", "Faculty of Sciences", "Science and technology"],
				["HUM", "Faculty of Humanities", ""],
			],
			note: "code = unique short identifier (e.g. SCI, TECH). Required.",
		},
		{
			name: "StudyCycles",
			headers: [
				"code *",
				"name *",
				"facultyCode *",
				"durationYears",
				"totalCredits",
			],
			examples: [
				["BTS", "Brevet de Technicien Superieur", "SCI", "2", "120"],
				["LP", "Licence Professionnelle", "SCI", "3", "180"],
			],
			note: "facultyCode must match a code in the Faculties sheet.",
		},
	],
	programmes: [
		{
			name: "Programmes",
			headers: [
				"code *",
				"name *",
				"cycleCode *",
				"facultyCode *",
				"durationYears",
				"totalCredits",
			],
			examples: [
				["GINF", "Computer Engineering", "BTS", "SCI", "2", "120"],
				["ACCT", "Accounting and Finance", "BTS", "HUM", "2", "120"],
			],
			note: "cycleCode and facultyCode must match codes from the Structure file.",
		},
	],
	equipe: [
		{
			name: "Users",
			headers: ["email *", "lastName *", "firstName *", "role"],
			examples: [
				["dr.dupont@univ.cm", "Dupont", "Jean", "teacher"],
				["mme.ngo@univ.cm", "Ngo", "Marie", "teacher"],
			],
			note: "role: teacher | administrator | staff  (default: teacher)",
		},
	],
};

// ─── Generate XLSX template ───────────────────────────────────────────────────

const HEADER_FILL = { fgColor: { rgb: "4C3BCF" } };
const HEADER_FONT = {
	bold: true,
	color: { rgb: "FFFFFF" },
	name: "Calibri",
	sz: 11,
};
const EXAMPLE_FONT = {
	color: { rgb: "9CA3AF" },
	name: "Calibri",
	sz: 10,
	italic: true,
};
const NOTE_FONT = { color: { rgb: "6B7280" }, name: "Calibri", sz: 9 };

export function generateTemplate(type: TemplateType): Buffer {
	const wb = XLSX.utils.book_new();

	for (const sheet of SHEET_DEFS[type]) {
		const rows: unknown[][] = [sheet.headers, ...sheet.examples];
		const ws = XLSX.utils.aoa_to_sheet(rows);

		for (let c = 0; c < sheet.headers.length; c++) {
			const cell = XLSX.utils.encode_cell({ r: 0, c });
			if (!ws[cell]) continue;
			ws[cell].s = {
				fill: HEADER_FILL,
				font: HEADER_FONT,
				alignment: { horizontal: "center" },
			};
		}

		for (let r = 1; r < rows.length; r++) {
			for (let c = 0; c < sheet.headers.length; c++) {
				const cell = XLSX.utils.encode_cell({ r, c });
				if (!ws[cell]) continue;
				ws[cell].s = { font: EXAMPLE_FONT };
			}
		}

		ws["!cols"] = sheet.headers.map((h) => ({
			wpx: h.includes("name") || h.includes("description") ? 200 : 110,
		}));

		const noteRow = rows.length;
		const noteCell = XLSX.utils.encode_cell({ r: noteRow, c: 0 });
		ws[noteCell] = { v: `ℹ  ${sheet.note}`, t: "s", s: { font: NOTE_FONT } };
		const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
		range.e.r = noteRow;
		ws["!ref"] = XLSX.utils.encode_range(range);

		XLSX.utils.book_append_sheet(wb, ws, sheet.name);
	}

	return XLSX.write(wb, {
		type: "buffer",
		bookType: "xlsx",
		cellStyles: true,
	}) as Buffer;
}

// ─── Parse uploaded XLSX ──────────────────────────────────────────────────────

export type ParsedSheet = {
	name: string;
	headers: string[];
	rows: Record<string, string>[];
	rowCount: number;
};

export type ParseResult = {
	sheets: ParsedSheet[];
	errors: string[];
};

function normalizeHeader(h: string): string {
	return h.replace(" *", "").trim().toLowerCase();
}

export function parseUpload(buffer: Buffer, type: TemplateType): ParseResult {
	const wb = XLSX.read(buffer, { type: "buffer" });
	const errors: string[] = [];
	const sheets: ParsedSheet[] = [];

	for (const def of SHEET_DEFS[type]) {
		const ws = wb.Sheets[def.name];
		if (!ws) {
			errors.push(`Sheet "${def.name}" not found in the uploaded file.`);
			continue;
		}

		const raw = XLSX.utils.sheet_to_json<string[]>(ws, {
			header: 1,
			defval: "",
		});
		if (raw.length < 2) {
			errors.push(`Sheet "${def.name}" contains no data rows.`);
			continue;
		}

		const headerRow = (raw[0] as string[]).map(normalizeHeader);
		const requiredKeys = def.headers
			.filter((h) => h.includes("*"))
			.map(normalizeHeader);

		for (const key of requiredKeys) {
			if (!headerRow.includes(key)) {
				errors.push(`Missing required column "${key}" in sheet "${def.name}".`);
			}
		}

		const dataRows = (raw.slice(1) as string[][])
			.filter((row) => row.some((cell) => cell.toString().trim() !== ""))
			.filter(
				(row) =>
					!def.examples.some((ex) => ex[0] === row[0]?.toString().trim()),
			);

		const rows = dataRows.map((row) => {
			const obj: Record<string, string> = {};
			headerRow.forEach((h, i) => {
				obj[h] = row[i]?.toString().trim() ?? "";
			});
			return obj;
		});

		rows.forEach((row, i) => {
			for (const key of requiredKeys) {
				if (!row[key]) {
					errors.push(
						`Sheet "${def.name}", row ${i + 2}: required field "${key}" is missing.`,
					);
				}
			}
		});

		sheets.push({
			name: def.name,
			headers: def.headers.map(normalizeHeader),
			rows,
			rowCount: rows.length,
		});
	}

	return { sheets, errors };
}

// ─── Convert parsed data to YAML strings ─────────────────────────────────────

export type SeedData = {
	structure?: ParseResult;
	programmes?: ParseResult;
	equipe?: ParseResult;
	orgName: string;
	orgSlug: string;
	adminEmail: string;
	adminName: string;
	adminPassword: string;
};

export function buildFoundationYaml(data: SeedData): string {
	const faculties =
		data.structure?.sheets.find((s) => s.name === "Faculties")?.rows ?? [];
	const cycles =
		data.structure?.sheets.find((s) => s.name === "StudyCycles")?.rows ?? [];

	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: data.orgSlug,
		},
		organizations: [{ slug: data.orgSlug, name: data.orgName }],
		examTypes: [
			{
				name: "CC",
				description: "Continuous Assessment",
				defaultPercentage: 40,
			},
			{ name: "FINAL", description: "Final Exam", defaultPercentage: 60 },
		],
		faculties: faculties.map((r) => ({
			code: r.code,
			name: r.name,
			...(r.description ? { description: r.description } : {}),
		})),
		studyCycles: cycles.map((r) => ({
			code: r.code,
			name: r.name,
			facultyCode: r.facultycode,
			...(r.durationyears ? { durationYears: Number(r.durationyears) } : {}),
			...(r.totalcredits
				? { totalCreditsRequired: Number(r.totalcredits) }
				: {}),
		})),
	});
}

export function buildAcademicsYaml(data: SeedData): string {
	const programmes =
		data.programmes?.sheets.find((s) => s.name === "Programmes")?.rows ?? [];

	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: data.orgSlug,
		},
		programs: programmes.map((r) => ({
			code: r.code,
			nameFr: r.name,
			studyCycleCode: r.cyclecode,
			facultyCode: r.facultycode,
			...(r.durationyears ? { durationYears: Number(r.durationyears) } : {}),
			...(r.totalcredits ? { totalCredits: Number(r.totalcredits) } : {}),
		})),
	});
}

export function buildUsersYaml(data: SeedData): string {
	const users = data.equipe?.sheets.find((s) => s.name === "Users")?.rows ?? [];

	const ROLE_MAP: Record<string, string> = {
		administrator: "administrator",
		admin: "administrator",
		teacher: "teacher",
		staff: "staff",
	};

	const authUsers = [
		{
			code: "ADMIN-ROOT",
			email: data.adminEmail,
			name: data.adminName,
			password: data.adminPassword,
			role: "admin",
		},
		...users.map((u, i) => ({
			code: `USER-${String(i + 1).padStart(3, "0")}`,
			email: u.email,
			name: `${u.firstname} ${u.lastname}`,
			password: randomPassword(),
			role: ROLE_MAP[u.role?.toLowerCase()] ? "admin" : "user",
		})),
	];

	const domainUsers = [
		{
			code: "DOMAIN-ROOT",
			authUserEmail: data.adminEmail,
			firstName: data.adminName.split(" ")[0] ?? data.adminName,
			lastName: data.adminName.split(" ").slice(1).join(" ") || data.adminName,
			primaryEmail: data.adminEmail,
			memberRole: "super_admin",
		},
		...users.map((u, i) => ({
			code: `DOMAIN-${String(i + 1).padStart(3, "0")}`,
			authUserEmail: u.email,
			firstName: u.firstname,
			lastName: u.lastname,
			primaryEmail: u.email,
			memberRole: ROLE_MAP[u.role?.toLowerCase()] ?? "teacher",
		})),
	];

	return yaml.stringify({
		meta: {
			version: "2025",
			generatedAt: new Date().toISOString(),
			dataset: data.orgSlug,
		},
		authUsers,
		domainUsers,
	});
}

function randomPassword(): string {
	const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
	return Array.from(
		{ length: 10 },
		() => chars[Math.floor(Math.random() * chars.length)],
	).join("");
}
