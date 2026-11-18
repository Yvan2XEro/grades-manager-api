import type { ImportJournal } from "../import-journal";

/** One column of an import sheet, identified in the file by its French header. */
export interface ColumnDef {
	key: string;
	header: string;
	required?: boolean;
	/** Shown as a cell note on the header. */
	hint?: string;
	/** Allowed values (dropdown in the template, checked on import). */
	enum?: readonly string[];
	/** Dropdown filled with values of another list (e.g. existing cycle codes). */
	listFrom?: string;
	type?: "text" | "integer" | "number" | "email" | "date";
	/** Other headers accepted for this column (e.g. English, other software). */
	aliases?: string[];
	width?: number;
}

export interface SheetDef {
	name: string;
	description: string;
	columns: ColumnDef[];
}

export type IssueLevel = "error" | "warning";

/** A problem found on one row of the uploaded file. */
export interface ImportIssue {
	sheet: string;
	row: number;
	column?: string;
	level: IssueLevel;
	/** Fallback text; the web app translates `code` (`admin.dataImport.issues.*`). */
	message: string;
	code?: string;
	params?: Record<string, string | number>;
}

export type SheetRow = {
	row: number;
	values: Record<string, string>;
	/** Set when reading the file found an error on this row. */
	invalid?: boolean;
};

/** What an import would do, per sheet. */
export interface SheetSummary {
	sheet: string;
	create: number;
	update: number;
	unchanged: number;
	skipped: number;
}

/** One row the import creates or updates, with the values that change. */
export interface RowChange {
	sheet: string;
	row: number;
	action: "create" | "update";
	/** What the row is about (code, registration number + name…). */
	label: string;
	/** Changed fields only, by column header. */
	before?: Record<string, string>;
	after: Record<string, string>;
}

export interface ImportPlan {
	sheets: SheetSummary[];
	issues: ImportIssue[];
	/** Detail of the creations and updates (shown in the review). */
	changes?: RowChange[];
	/** Applies the valid rows; rows with errors are left out. What it creates
	 * and changes is recorded in the journal, so the import can be undone. */
	apply: (
		log: (message: string) => Promise<void>,
		journal: ImportJournal,
	) => Promise<void>;
}

export interface StepContext {
	institutionId: string;
	/** Set for the steps of an academic year (`scope: "year"`). */
	academicYearId?: string;
	/** Profile running the import (traced on overrides). */
	actorId?: string;
}

/** A step of the guided import: its sheets, its pre-filled template and its plan. */
export interface ImportStepDef {
	key: string;
	label: string;
	/** Foundation steps are done once; year steps once per academic year. */
	scope?: "institution" | "year";
	sheets: SheetDef[];
	/** Current data, written in the template so a re-import updates it. */
	existingRows: (ctx: StepContext) => Promise<Record<string, string[][]>>;
	/** Values offered in dropdowns, by list name (see `ColumnDef.listFrom`). */
	lists?: (ctx: StepContext) => Promise<Record<string, string[]>>;
	plan: (
		rows: Record<string, SheetRow[]>,
		ctx: StepContext,
	) => Promise<ImportPlan>;
	/** Steps whose sheets depend on the data (one sheet per class…) build
	 * their own template and read their own workbook. */
	template?: (ctx: StepContext) => Promise<Buffer>;
	read?: (
		buffer: Buffer,
		ctx: StepContext,
	) => Promise<{ rows: Record<string, SheetRow[]>; issues: ImportIssue[] }>;
}
