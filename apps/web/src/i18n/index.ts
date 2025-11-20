import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";

const resources = {
	en: {
		translation: en,
	},
	fr: {
		translation: fr,
	},
};

const lng = localStorage.getItem("lng") || "en";

i18n.use(initReactI18next).init({
	resources,
	lng,

	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
