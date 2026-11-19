import i18n from "@/i18n";

const locale = () => ((i18n.language ?? "fr").startsWith("en") ? "en" : "fr");

/**
 * Formats a ratio (0.458) as a percentage in the UI language: "45.8%" /
 * "45,8 %". Returns "—" for a missing value.
 */
export function formatPercent(
	ratio: number | null | undefined,
	fractionDigits = 1,
): string {
	if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "—";
	return new Intl.NumberFormat(locale(), {
		style: "percent",
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(ratio);
}

/** A grade or average in the UI language: "12,46" / "12.46"; "—" if missing. */
export function formatDecimal(
	value: number | null | undefined,
	fractionDigits = 2,
): string {
	if (value === null || value === undefined || Number.isNaN(value)) return "—";
	return new Intl.NumberFormat(locale(), {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(value);
}
