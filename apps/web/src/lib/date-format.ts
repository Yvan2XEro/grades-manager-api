import { format as formatFns } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import i18n from "@/i18n";

/** date-fns locale of the current UI language. */
export function dateLocale() {
	return (i18n.language ?? "fr").startsWith("en") ? enUS : fr;
}

/**
 * Formats a date in the UI language. Patterns are date-fns ones; prefer the
 * localized tokens: "PP" (15 nov. 2025 / Nov 15, 2025), "PPp" (with time),
 * "P" (15/11/2025).
 */
export function formatDate(
	value: Date | string | number | null | undefined,
	pattern = "PP",
): string {
	if (value === null || value === undefined || value === "") return "";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return formatFns(date, pattern, { locale: dateLocale() });
}
