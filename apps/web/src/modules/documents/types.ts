export const EXPORT_TYPES = [
	{ value: "pv", label: "PV (Procès-Verbal)" },
	{ value: "evaluation", label: "Evaluation" },
	{ value: "ue", label: "UE (Teaching Unit)" },
	{ value: "deliberation", label: "Délibération" },
	{ value: "diploma", label: "Diplôme" },
	{ value: "transcript", label: "Relevé de notes" },
	{ value: "attestation", label: "Attestation" },
	{ value: "student_list", label: "Liste d'étudiants" },
] as const;

export type ExportTemplateType = (typeof EXPORT_TYPES)[number]["value"];

export const getExportTypeLabel = (type: string) =>
	EXPORT_TYPES.find((t) => t.value === type)?.label || type;
