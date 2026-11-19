import i18n from "@/i18n";

/** Currencies shown by their local name: the CFA franc reads "FCFA". */
const CURRENCY_LABELS: Record<string, string> = { XAF: "FCFA", XOF: "FCFA" };

/**
 * Formats an amount in the UI language: "250 000 FCFA" (fr), "250,000 FCFA"
 * (en). The CFA franc has no decimals; other currencies keep up to two.
 * Accepts the decimal strings the API returns; `—` when missing.
 */
export function formatMoney(
	amount: number | string | null | undefined,
	currency = "XAF",
): string {
	if (amount === null || amount === undefined || amount === "") return "—";
	const value = Number(amount);
	if (Number.isNaN(value)) return "—";
	const code = (currency || "XAF").toUpperCase();
	const label = CURRENCY_LABELS[code] ?? code;
	const locale = (i18n.language ?? "fr").startsWith("en") ? "en-US" : "fr-FR";
	const number = new Intl.NumberFormat(locale, {
		maximumFractionDigits: CURRENCY_LABELS[code] ? 0 : 2,
	}).format(value);
	// Non-breaking space: the amount never wraps away from its currency
	return `${number} ${label}`;
}

/** Label of a currency code ("FCFA" for XAF), e.g. next to an amount input. */
export const currencyLabel = (currency = "XAF") =>
	CURRENCY_LABELS[currency.toUpperCase()] ?? currency.toUpperCase();
