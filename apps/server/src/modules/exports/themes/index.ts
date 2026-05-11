import type { ExportTemplateType } from "../../../db/schema/app-schema";
import {
	type AttestationTheme,
	attestationClassicTheme,
	attestationThemePresets,
	attestationThemeSchema,
} from "./attestation-theme";
import {
	type DiplomaTheme,
	diplomaClassicTheme,
	diplomaThemePresets,
	diplomaThemeSchema,
} from "./diploma-theme";
import {
	type StudentListTheme,
	studentListClassicTheme,
	studentListThemePresets,
	studentListThemeSchema,
} from "./student-list-theme";
import {
	type TranscriptTheme,
	transcriptClassicTheme,
	transcriptThemePresets,
	transcriptThemeSchema,
} from "./transcript-theme";

export type DocumentTheme =
	| DiplomaTheme
	| TranscriptTheme
	| AttestationTheme
	| StudentListTheme;

export type ThemeKind = Extract<
	ExportTemplateType,
	"diploma" | "transcript" | "attestation" | "student_list"
>;

export const documentThemeKinds: ThemeKind[] = [
	"diploma",
	"transcript",
	"attestation",
	"student_list",
];

export function isDocumentThemeKind(kind: string): kind is ThemeKind {
	return (documentThemeKinds as readonly string[]).includes(kind);
}

const SCHEMAS = {
	diploma: diplomaThemeSchema,
	transcript: transcriptThemeSchema,
	attestation: attestationThemeSchema,
	student_list: studentListThemeSchema,
} as const;

const DEFAULTS = {
	diploma: diplomaClassicTheme,
	transcript: transcriptClassicTheme,
	attestation: attestationClassicTheme,
	student_list: studentListClassicTheme,
} as const;

const PRESETS = {
	diploma: diplomaThemePresets,
	transcript: transcriptThemePresets,
	attestation: attestationThemePresets,
	student_list: studentListThemePresets,
} as const;

export function getThemeSchema(kind: ThemeKind) {
	return SCHEMAS[kind];
}

export function getDefaultTheme(kind: ThemeKind): DocumentTheme {
	return DEFAULTS[kind];
}

export function getThemePresets(kind: ThemeKind) {
	return PRESETS[kind];
}

/**
 * Deep-merge two partial themes. Right wins on conflict.
 * Arrays and primitives replace; only plain objects are recursed into.
 */
export function mergeTheme<T>(base: T, override: unknown): T {
	if (!override || typeof override !== "object") return base;
	if (Array.isArray(override)) return override as T;
	if (typeof base !== "object" || base === null) return override as T;

	const result: Record<string, unknown> = {
		...(base as Record<string, unknown>),
	};
	for (const [key, value] of Object.entries(
		override as Record<string, unknown>,
	)) {
		const baseValue = (base as Record<string, unknown>)[key];
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			baseValue !== null &&
			typeof baseValue === "object" &&
			!Array.isArray(baseValue)
		) {
			result[key] = mergeTheme(baseValue, value);
		} else {
			result[key] = value;
		}
	}
	return result as T;
}

/**
 * Resolve the final theme from the layered sources (template defaults +
 * program/class overrides). Falls back to the classic preset if anything is
 * missing. Throws if the resulting object fails Zod validation.
 */
export function resolveTheme(
	kind: ThemeKind,
	templateDefaults: unknown,
	...overrides: Array<unknown>
): DocumentTheme {
	const fallback = getDefaultTheme(kind);
	const baseFromTemplate = mergeTheme(fallback, templateDefaults);
	let merged = baseFromTemplate;
	for (const o of overrides) merged = mergeTheme(merged, o);
	return getThemeSchema(kind).parse(merged) as DocumentTheme;
}

export type {
	DiplomaTheme,
	TranscriptTheme,
	AttestationTheme,
	StudentListTheme,
};

export {
	diplomaThemeSchema,
	transcriptThemeSchema,
	attestationThemeSchema,
	studentListThemeSchema,
	diplomaClassicTheme,
	transcriptClassicTheme,
	attestationClassicTheme,
	studentListClassicTheme,
	diplomaThemePresets,
	transcriptThemePresets,
	attestationThemePresets,
	studentListThemePresets,
};
