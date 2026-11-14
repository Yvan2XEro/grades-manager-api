import * as XLSX from "xlsx";
import { downloadBlob } from "@/lib/download";

export interface BulkExportClass {
	id: string;
	name: string;
	code: string;
	program?: { name?: string } | null;
	academicYear?: { name?: string } | null;
}

export type BulkExportFormat = "pdf" | "xlsx";
export type BulkExportMode = "separated" | "unified";
export type BulkExportStatus =
	| { state: "pending" }
	| { state: "running" }
	| { state: "ok" }
	| { state: "error"; error: string };

export type ExportStudent = {
	id: string;
	registrationNumber: string;
	profile: {
		firstName: string;
		lastName: string;
		gender?: string | null;
		dateOfBirth?: string | null;
	};
};

export type ClassExport = {
	cls: BulkExportClass;
	students: ExportStudent[];
	pdfBase64?: string;
	pdfFilename?: string;
};

/** Saves the exported lists: one multi-sheet workbook, or a ZIP with one file per class. */
export async function saveClassExports(
	results: ClassExport[],
	format: BulkExportFormat,
	mode: BulkExportMode,
	institutionName: string,
) {
	const date = new Date().toISOString().slice(0, 10);
	if (format === "xlsx" && mode === "unified") {
		// Single workbook, one sheet per class.
		const workbook = XLSX.utils.book_new();
		for (const r of results) {
			const ws = buildClassWorksheet(r.cls, r.students, institutionName);
			XLSX.utils.book_append_sheet(
				workbook,
				ws,
				sheetSafe(r.cls.code || r.cls.name),
			);
		}
		XLSX.writeFile(workbook, `listes_classes_${date}.xlsx`);
	} else {
		// ZIP — one file per class (PDF or XLSX).
		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();
		for (const r of results) {
			if (format === "pdf" && r.pdfBase64 && r.pdfFilename) {
				zip.file(r.pdfFilename, r.pdfBase64, { base64: true });
			} else if (format === "xlsx") {
				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(
					wb,
					buildClassWorksheet(r.cls, r.students, institutionName),
					"Étudiants",
				);
				const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
				zip.file(`liste_${slugify(r.cls.code || r.cls.name)}.xlsx`, buf);
			}
		}
		const blob = await zip.generateAsync({ type: "blob" });
		downloadBlob(blob, `listes_classes_${date}.zip`);
	}
}

export function buildClassWorksheet(
	cls: BulkExportClass,
	students: Array<{
		registrationNumber: string;
		profile: {
			firstName: string;
			lastName: string;
			gender?: string | null;
			dateOfBirth?: string | null;
		};
	}>,
	institutionName: string,
): XLSX.WorkSheet {
	// Seed/UI convention: profile.firstName carries the family name (NOM,
	// shown first); profile.lastName carries the given names (Prénoms).
	const sortedStudents = [...students].sort(
		(a, b) =>
			(a.profile.firstName ?? "").localeCompare(b.profile.firstName ?? "") ||
			(a.profile.lastName ?? "").localeCompare(b.profile.lastName ?? ""),
	);
	const headerRows: (string | number)[][] = [
		[institutionName],
		[],
		[`Liste d'étudiants — ${cls.name}`],
		[],
		[`Code: ${cls.code}`],
		[`Programme: ${cls.program?.name ?? "—"}`],
		[`Année: ${cls.academicYear?.name ?? "—"}`],
		[`Effectif: ${sortedStudents.length}`],
		[],
		["#", "Matricule", "Nom", "Prénom(s)", "Date de naissance", "Genre"],
	];
	const rows = sortedStudents.map((s, i) => [
		i + 1,
		s.registrationNumber || "-",
		s.profile.firstName ?? "",
		s.profile.lastName ?? "",
		s.profile.dateOfBirth
			? new Date(s.profile.dateOfBirth).toLocaleDateString()
			: "-",
		mapGender(s.profile.gender),
	]);
	const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...rows]);
	ws["!cols"] = [
		{ wch: 5 },
		{ wch: 18 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 14 },
		{ wch: 8 },
	];
	return ws;
}

export function mapGender(raw: string | null | undefined): string {
	if (!raw) return "-";
	const v = String(raw).trim().toLowerCase();
	if (v === "male" || v === "m" || v === "homme" || v === "h") return "M";
	if (v === "female" || v === "f" || v === "femme") return "F";
	if (v === "other" || v === "autre") return "Autre";
	return String(raw).toUpperCase();
}

export function sheetSafe(name: string): string {
	// Excel sheet names: max 31 chars, no [ ] : * ? / \ chars.
	return name.replace(/[[\]:*?/\\]/g, "_").slice(0, 31);
}

export function slugify(s: string): string {
	return s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-zA-Z0-9_-]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}
