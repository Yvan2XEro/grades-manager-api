import { createContext, useContext, useEffect, useState } from "react";
import { en } from "./en";
import type { Translations } from "./fr";
import { fr } from "./fr";

type Lang = "fr" | "en";

const dicts: Record<Lang, Translations> = { fr, en };

interface I18nCtx {
	t: (key: string) => string;
	tArr: (key: string) => any[];
	lang: Lang;
	setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nCtx>({
	t: (k) => k,
	tArr: () => [],
	lang: "fr",
	setLang: () => {},
});

function resolve(obj: any, path: string): any {
	return path.split(".").reduce((o, k) => o?.[k], obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLangState] = useState<Lang>("fr");

	useEffect(() => {
		const saved = localStorage.getItem("tkams-lang") as Lang;
		if (saved === "fr" || saved === "en") setLangState(saved);
	}, []);

	function setLang(l: Lang) {
		setLangState(l);
		localStorage.setItem("tkams-lang", l);
	}

	function t(key: string): string {
		const val = resolve(dicts[lang], key);
		return typeof val === "string" ? val : key;
	}

	function tArr(key: string): any[] {
		const val = resolve(dicts[lang], key);
		return Array.isArray(val) ? val : [];
	}

	return (
		<I18nContext.Provider value={{ t, tArr, lang, setLang }}>
			{children}
		</I18nContext.Provider>
	);
}

export function useI18n() {
	return useContext(I18nContext);
}
