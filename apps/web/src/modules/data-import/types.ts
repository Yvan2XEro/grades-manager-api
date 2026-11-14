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
