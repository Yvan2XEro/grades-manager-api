import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class MemoryStorage implements Storage {
	private store = new Map<string, string>();
	get length() {
		return this.store.size;
	}
	clear() {
		this.store.clear();
	}
	getItem(key: string) {
		return this.store.get(key) ?? null;
	}
	key(index: number) {
		return Array.from(this.store.keys())[index] ?? null;
	}
	removeItem(key: string) {
		this.store.delete(key);
	}
	setItem(key: string, value: string) {
		this.store.set(key, value);
	}
}

if (typeof window !== "undefined" && !window.localStorage) {
	Object.defineProperty(window, "localStorage", {
		value: new MemoryStorage(),
		configurable: true,
	});
}

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
