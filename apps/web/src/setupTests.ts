import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, unknown>) =>
			(typeof opts?.defaultValue === "string" ? opts.defaultValue : key) ?? key,
		i18n: { changeLanguage: vi.fn() },
	}),
	initReactI18next: {
		type: "3rdParty",
		init: vi.fn(),
	},
}));
