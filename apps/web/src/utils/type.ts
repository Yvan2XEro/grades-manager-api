import type { RouterOutputs } from "./trpc";

/** Dates are serialized as ISO strings over the wire. */
type DateToString<T> = T extends Date
	? string
	: T extends object
		? { [K in keyof T]: DateToString<T[K]> }
		: T;

// Exam Types
export type ExamType = DateToString<
	RouterOutputs["examTypes"]["list"]
>["items"][number];

// Export Templates
export type ExportTemplate = DateToString<
	RouterOutputs["exportTemplates"]["list"]
>["items"][number];

// Diplomation Keys (ApiKeys)
export type ApiKey = DateToString<
	RouterOutputs["diplomationKeys"]["list"]
>[number];

// Semesters
export type Semester = DateToString<
	RouterOutputs["semesters"]["list"]
>["items"][number];
