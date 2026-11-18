import { en } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "en";

// Each locale has the same shape but different literal strings — use a wider type
export type Translations = typeof fr | typeof en;

const dict = { fr, en } as const;

export function t(locale: Locale): Translations {
	return dict[locale] ?? dict.fr;
}
