/**
 * Metadata about each theme group used by ThemeEditor.
 *
 * The shape of a document theme is `Record<groupKey, Record<fieldKey, value>>`.
 * For each group we declare which tab it belongs to; labels are translated.
 */

import i18n from "@/i18n";

export type ThemeTab = "typography" | "colors" | "sizes" | "options";

export type GroupMeta = {
	tab: ThemeTab;
};

/** Labels live in `admin.documents.theme.groups.<groupKey>.{label,description}`. */
export const GROUP_META: Record<string, GroupMeta> = {
	fonts: { tab: "typography" },
	sizes: { tab: "sizes" },
	colors: { tab: "colors" },
	borders: { tab: "sizes" },
	logos: { tab: "sizes" },
	qrCode: { tab: "options" },
	titleEffects: { tab: "typography" },
	spacing: { tab: "sizes" },
	display: { tab: "options" },
	watermark: { tab: "options" },
	page: { tab: "options" },
	table: { tab: "options" },
};

const translateOr = (key: string, fallback: string): string =>
	i18n.exists(key) ? i18n.t(key as never) : fallback;

/** Translated label of a theme group (falls back to the raw key). */
export function groupLabel(group: string): string {
	return translateOr(`admin.documents.theme.groups.${group}.label`, group);
}

/** Translated description of a theme group, if any. */
export function groupDescription(group: string): string | undefined {
	const key = `admin.documents.theme.groups.${group}.description`;
	return i18n.exists(key) ? i18n.t(key as never) : undefined;
}

/** Translated label of a theme editor tab. */
export function tabLabel(tab: ThemeTab): string {
	return i18n.t(`admin.documents.theme.tabs.${tab}`);
}

export const FONT_LIST = [
	"Times New Roman, serif",
	"Georgia, serif",
	"Garamond, serif",
	"Palatino, serif",
	"Cambria, serif",
	"Baskerville, serif",
	"Book Antiqua, serif",
	"Didot, serif",
	"Bodoni MT, serif",
	"Constantia, serif",
	"Arial, sans-serif",
	"Helvetica, sans-serif",
	"Calibri, sans-serif",
	"Verdana, sans-serif",
	"Tahoma, sans-serif",
	"Trebuchet MS, sans-serif",
	"Segoe UI, sans-serif",
	"Open Sans, sans-serif",
	"Roboto, sans-serif",
	"Lato, sans-serif",
	"Montserrat, sans-serif",
	"Source Sans Pro, sans-serif",
];

/** Field labels live in `admin.documents.theme.fields.<fieldKey>`. */
export function fieldLabel(_group: string, field: string): string {
	return translateOr(
		`admin.documents.theme.fields.${field}`,
		field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
	);
}

/**
 * Inspect a value to decide how to render it.
 * - hex string → color
 * - one of FONT_LIST → font select
 * - number → slider
 * - boolean → switch
 * - "french"|"english"|"A4"|"A3"|"Letter"|"portrait"|"landscape" → enum select
 */
export type FieldKind =
	| "color"
	| "font"
	| "number"
	| "boolean"
	| "page-size"
	| "page-orientation"
	| "language"
	| "text"
	| "object";

export function detectFieldKind(value: unknown, fieldKey?: string): FieldKind {
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "number") return "number";
	if (typeof value === "string") {
		if (/^#[0-9a-f]{6}$/i.test(value)) return "color";
		if (FONT_LIST.includes(value)) return "font";
		if (value === "french" || value === "english") return "language";
		if (value === "portrait" || value === "landscape")
			return "page-orientation";
		if (value === "A4" || value === "A3" || value === "Letter")
			return "page-size";
		// Conservative fallbacks based on field name
		if (fieldKey?.toLowerCase().includes("color")) return "color";
		return "text";
	}
	if (value !== null && typeof value === "object") return "object";
	return "text";
}

/** Group ordering inside a tab — most-used groups first. */
export const TAB_GROUP_ORDER: Record<ThemeTab, string[]> = {
	typography: ["fonts", "titleEffects"],
	colors: ["colors"],
	sizes: ["sizes", "spacing", "borders", "logos"],
	options: ["display", "watermark", "qrCode", "page", "table"],
};
