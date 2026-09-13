import { en } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "en";

/**
 * Widen literal types to their base primitives, recursively.
 *
 * `typeof fr` infers every value as a *literal* ("Accueil", not string), so a
 * dictionary typed directly against it would reject every translation — the
 * English "Home" is not assignable to the literal type "Accueil". Widening
 * keeps the structure (which keys exist, which are arrays, how objects nest)
 * while letting any string of the right shape satisfy it.
 */
type Widen<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T extends ReadonlyArray<infer U>
				? readonly Widen<U>[]
				: T extends object
					? { readonly [K in keyof T]: Widen<T[K]> }
					: T;

export type Dict = Widen<typeof fr>;

export { setLocale } from "./actions";

/**
 * FR is the source of truth for the shape; `en` is checked against it here.
 * This assignment is deliberately NOT a cast — it is what makes a missing or
 * misspelled English key a build error instead of `undefined` at runtime.
 */
const dictionaries: Record<Locale, Dict> = { fr, en };

export function getDict(locale: Locale): Dict {
	return dictionaries[locale] ?? dictionaries.fr;
}

export async function getLocale(): Promise<Locale> {
	const { cookies, headers } = await import("next/headers");
	const cookieStore = await cookies();
	const localeCookie = cookieStore.get("tkams_locale");
	if (localeCookie?.value === "en" || localeCookie?.value === "fr") {
		return localeCookie.value as Locale;
	}
	const headerStore = await headers();
	const acceptLang = headerStore.get("accept-language") || "";
	if (acceptLang.toLowerCase().startsWith("en")) return "en";
	return "fr";
}

/**
 * True when the visitor has not yet explicitly picked a language (no
 * `tkams_locale` cookie). Used to show the first-visit language prompt.
 */
export async function hasChosenLocale(): Promise<boolean> {
	const { cookies } = await import("next/headers");
	const cookieStore = await cookies();
	const value = cookieStore.get("tkams_locale")?.value;
	return value === "en" || value === "fr";
}
