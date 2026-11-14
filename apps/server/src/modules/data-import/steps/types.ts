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
	type?: "text" | "integer" | "number" | "email";
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
	message: string;
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

export interface ImportPlan {
	sheets: SheetSummary[];
	issues: ImportIssue[];
	/** Applies the valid rows; rows with errors are left out. */
	apply: (log: (message: string) => Promise<void>) => Promise<void>;
}

export interface StepContext {
	institutionId: string;
}

/** A step of the guided import: its sheets, its pre-filled template and its plan. */
export interface ImportStepDef {
	key: string;
	label: string;
	sheets: SheetDef[];
	/** Current data, written in the template so a re-import updates it. */
	existingRows: (ctx: StepContext) => Promise<Record<string, string[][]>>;
	/** Values offered in dropdowns, by list name (see `ColumnDef.listFrom`). */
	lists?: (ctx: StepContext) => Promise<Record<string, string[]>>;
	plan: (
		rows: Record<string, SheetRow[]>,
		ctx: StepContext,
	) => Promise<ImportPlan>;
}
