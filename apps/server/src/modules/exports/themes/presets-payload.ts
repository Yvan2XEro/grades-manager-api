import { getDefaultTheme, getThemePresets, type ThemeKind } from "./index";

/**
 * Lightweight description of a theme preset, suitable for sending to the UI
 * (so the frontend can render a preset picker without re-importing the
 * heavy schema definitions).
 */
export type ThemePresetDescriptor = {
	kind: ThemeKind;
	id: "classic" | "elegant" | "modern" | "compact" | "large";
	name: string;
	description: string;
	theme: Record<string, unknown>;
};

const PRESET_LABELS: Record<ThemePresetDescriptor["id"], string> = {
	classic: "Classic",
	elegant: "Elegant",
	modern: "Modern",
	compact: "Compact",
	large: "Large",
};

const PRESET_DESCRIPTIONS: Record<ThemePresetDescriptor["id"], string> = {
	classic: "Style traditionnel avec polices serif",
	elegant: "Design raffiné, polices Garamond/Didot",
	modern: "Style sobre avec polices sans-serif",
	compact: "Tailles réduites pour plus de contenu",
	large: "Tailles agrandies pour meilleure lisibilité",
};

export function getPresetDescriptors(kind: ThemeKind): ThemePresetDescriptor[] {
	const presets = getThemePresets(kind);
	const ids: ThemePresetDescriptor["id"][] = [
		"classic",
		"elegant",
		"modern",
		"compact",
		"large",
	];
	return ids.map((id) => ({
		kind,
		id,
		name: PRESET_LABELS[id],
		description: PRESET_DESCRIPTIONS[id],
		theme: presets[id] as unknown as Record<string, unknown>,
	}));
}

export function getDefaultThemePayload(
	kind: ThemeKind,
): Record<string, unknown> {
	return getDefaultTheme(kind) as unknown as Record<string, unknown>;
}
