import i18n from "@/i18n";

export const EXPORT_TYPES = [
	{ value: "pv" },
	{ value: "evaluation" },
	{ value: "ue" },
	{ value: "deliberation" },
	{ value: "diploma" },
	{ value: "transcript" },
	{ value: "attestation" },
	{ value: "student_list" },
] as const;

export type ExportTemplateType = (typeof EXPORT_TYPES)[number]["value"];

const isExportTemplateType = (type: string): type is ExportTemplateType =>
	EXPORT_TYPES.some((t) => t.value === type);

/** Translated label of an export template type (falls back to the raw type). */
export const getExportTypeLabel = (type: string) =>
	isExportTemplateType(type)
		? i18n.t(`admin.exportTemplates.types.${type}`)
		: type;
