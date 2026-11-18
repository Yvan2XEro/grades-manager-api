import { format } from "date-fns";
import i18n from "@/i18n";
import type { ExcelRow, ExportConfig, ExportContext } from "../types";

const INFO_KEYS = ["class", "program", "semester", "academicYear"] as const;
type InfoKey = (typeof INFO_KEYS)[number];

const infoLabel = (key: InfoKey) => i18n.t(`admin.gradeExport.header.${key}`);

/** `Class: …`, `Program: …` context row of an Excel header. */
export const infoRow = (key: InfoKey, value: string) =>
	`${infoLabel(key)} ${value}`;

/** `Class: …`, `Program: …` rows are rendered with a bold label. */
export const isInfoRow = (value: string) =>
	INFO_KEYS.some((key) => value.startsWith(infoLabel(key)));

/** Picks the French or English variant of an institution field. */
export const localizedName = (fr?: string | null, en?: string | null) =>
	(i18n.language.startsWith("fr") ? fr || en : en || fr) || "";

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
		headerRows.push([
			localizedName(config.institution.name_fr, config.institution.name_en),
		]);
		const facultyName = localizedName(
			config.institution.faculty_name_fr,
			config.institution.faculty_name_en,
		);
		if (facultyName) headerRows.push([facultyName]);
	}

	// Document title and info
	headerRows.push([""]);
	headerRows.push([title]);
	headerRows.push([""]);

	if (classData || semester || year) {
		if (classData) headerRows.push([infoRow("class", classData.name)]);
		if (classData?.program)
			headerRows.push([infoRow("program", classData.program.name)]);
		if (semester) headerRows.push([infoRow("semester", semester.name)]);
		if (year) headerRows.push([infoRow("academicYear", year.name)]);
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
