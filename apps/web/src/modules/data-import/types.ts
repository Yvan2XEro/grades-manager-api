import type { RouterOutputs } from "@/utils/trpc";

/** Formats of the former single-file importers (kept under "Import avancé"). */
export type ImportType =
	| "academic-structure"
	| "people"
	| "enrollments"
	| "grades-bulk";

export type PreviewRow = { row: number; col?: string; message: string };

export type PreviewSummary = {
	errors?: PreviewRow[];
	warnings?: PreviewRow[];
	[key: string]: unknown;
};

export const batchJobType = {
	"academic-structure": "import.academicStructure",
	people: "import.people",
	enrollments: "import.enrollments",
	"grades-bulk": "import.gradesBulk",
} as const;

export type ImportOverview = RouterOutputs["dataImport"]["overview"];
export type FoundationStep = ImportOverview["foundations"][number];
export type ImportYear = ImportOverview["years"][number];
export type StepSheets = RouterOutputs["dataImport"]["step"]["sheets"];

/** Row-level problem reported by the validation of an uploaded file. */
export interface ImportIssue {
	sheet: string;
	row: number;
	column?: string;
	level: "error" | "warning";
	message: string;
}

export interface SheetSummary {
	sheet: string;
	create: number;
	update: number;
	unchanged: number;
	skipped: number;
}

/** `previewResult` of an `import.step` batch job. */
export interface StepPreview {
	step: string;
	sheets: SheetSummary[];
	issues: ImportIssue[];
}

export type StepStatus = "done" | "skipped" | "todo";
