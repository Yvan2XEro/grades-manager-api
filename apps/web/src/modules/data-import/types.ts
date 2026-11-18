import type { RouterOutputs } from "@/utils/trpc";

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
	/** Fallback text; `code` + `params` are translated (`issues.codes.*`). */
	message: string;
	code?: string;
	params?: Record<string, string | number>;
}

export interface SheetSummary {
	sheet: string;
	create: number;
	update: number;
	unchanged: number;
	skipped: number;
}

/** One row the import creates or updates (changed fields only). */
export interface RowChange {
	sheet: string;
	row: number;
	action: "create" | "update";
	label: string;
	before?: Record<string, string>;
	after: Record<string, string>;
}

/** `previewResult` of an `import.step` batch job. */
export interface StepPreview {
	step: string;
	sheets: SheetSummary[];
	issues: ImportIssue[];
	changes?: RowChange[];
	changesTotal?: number;
}

export type StepStatus = "done" | "skipped" | "todo";
