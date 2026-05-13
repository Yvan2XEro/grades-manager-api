import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "auto";

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "auto";
	const stored = window.localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "auto")
		return stored;
	return "auto";
}

function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.classList.add(resolved);
	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", mode);
	}
	document.documentElement.style.colorScheme = resolved;
}

const icons: Record<ThemeMode, React.ElementType> = {
	light: Sun,
	dark: Moon,
	auto: Monitor,
};

const labels: Record<ThemeMode, string> = {
	light: "Mode clair",
	dark: "Mode sombre",
	auto: "Mode automatique",
};

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("auto");

	useEffect(() => {
		const initialMode = getInitialMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	useEffect(() => {
		if (mode !== "auto") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [mode]);

	function toggleMode() {
		const next: ThemeMode =
			mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
		setMode(next);
		applyThemeMode(next);
		window.localStorage.setItem("theme", next);
	}

	const Icon = icons[mode];

	return (
		<button
			type="button"
			onClick={toggleMode}
			aria-label={labels[mode]}
			title={labels[mode]}
			className="hover:-translate-y-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-[0_4px_12px_rgba(91,62,207,0.08)] transition hover:border-[var(--lagoon-deep)] hover:text-[var(--lagoon-deep)]"
		>
			<Icon className="h-3.5 w-3.5" strokeWidth={2} />
		</button>
	);
}
