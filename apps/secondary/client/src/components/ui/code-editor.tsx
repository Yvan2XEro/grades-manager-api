import { html } from "@codemirror/lang-html";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";

interface CodeEditorProps {
	value: string;
	onChange: (value: string) => void;
	minHeight?: string;
}

function usePrefersDark() {
	const [dark, setDark] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setDark(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);
	return dark;
}

export function CodeEditor({
	value,
	onChange,
	minHeight = "400px",
}: CodeEditorProps) {
	const dark = usePrefersDark();

	// Also check data-theme attribute on root (for explicit theme toggles)
	const [themePref, setThemePref] = useState(
		() => document.documentElement.dataset.theme ?? "system",
	);
	useEffect(() => {
		const observer = new MutationObserver(() => {
			setThemePref(document.documentElement.dataset.theme ?? "system");
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});
		return () => observer.disconnect();
	}, []);

	const isDark = themePref === "dark" || (themePref !== "light" && dark);

	return (
		<CodeMirror
			value={value}
			onChange={onChange}
			extensions={[html()]}
			theme={isDark ? githubDark : githubLight}
			style={{ minHeight, fontSize: "13px" }}
			className="overflow-hidden rounded-md border border-border"
			basicSetup={{
				lineNumbers: true,
				foldGutter: true,
				highlightActiveLine: true,
				autocompletion: true,
			}}
		/>
	);
}
