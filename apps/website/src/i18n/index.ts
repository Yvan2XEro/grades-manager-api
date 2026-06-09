import { en } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "en";
export type Dict = typeof fr;

export { setLocale } from "./actions";

export function getDict(locale: Locale): Dict {
	return locale === "en" ? (en as unknown as Dict) : fr;
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
