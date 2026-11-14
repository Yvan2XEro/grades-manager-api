import { format } from "date-fns";
import type { ExcelRow, ExportConfig, ExportContext } from "../types";

const INFO_PREFIXES = [
	"Classe:",
	"Programme:",
	"Semestre:",
	"Année Académique:",
];

/** `Classe: …`, `Programme: …` rows are rendered with a bold label. */
export const isInfoRow = (value: string) =>
	INFO_PREFIXES.some((prefix) => value.startsWith(prefix));

/**
 * Institution / title / context rows put above an Excel table
 * (transcript and per-exam exports).
 */
export function buildDocumentHeader(
	config: ExportConfig,
	title: string,
	{ classData, semester, year }: ExportContext,
	extraInfo: string[] = [],
): ExcelRow[] {
	const headerRows: ExcelRow[] = [];

	// Institution header
	if (config.institution) {
		headerRows.push([config.institution.name_fr || ""]);
		if (config.institution.faculty_name_fr) {
			headerRows.push([config.institution.faculty_name_fr]);
		}
	}

	// Document title and info
	headerRows.push([""]);
	headerRows.push([title]);
	headerRows.push([""]);

	if (classData || semester || year) {
		if (classData) headerRows.push([`Classe: ${classData.name}`]);
		if (classData?.program)
			headerRows.push([`Programme: ${classData.program.name}`]);
		if (semester) headerRows.push([`Semestre: ${semester.name}`]);
		if (year) headerRows.push([`Année Académique: ${year.name}`]);
		for (const info of extraInfo) headerRows.push([info]);
		headerRows.push([""]);
	}

	return headerRows;
}

/** `<prefix>_<class>[_<suffix>]_<yyyy-MM-dd>.xlsx` */
export function buildExportFilename(
	prefix: string,
	className: string,
	suffix?: string,
) {
	const normalizedSuffix = suffix ? `_${suffix}` : "";
	return `${prefix}_${className}${normalizedSuffix}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
}

export const slugify = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
