import {
	autocompletion,
	type Completion,
	type CompletionContext,
	type CompletionResult,
	snippetCompletion,
} from "@codemirror/autocomplete";
import { html } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
	HBS_BLOCK_HELPERS,
	HBS_INLINE_HELPERS,
	HBS_SNIPPETS,
	HBS_VARIABLES,
} from "./handlebars-catalog";

interface CodeEditorProps {
	value: string;
	onChange: (next: string) => void;
	className?: string;
	readOnly?: boolean;
	placeholder?: string;
}

/**
 * HTML/Handlebars code editor (CodeMirror 6).
 *
 * Features:
 *   - Syntax highlighting (HTML grammar; Handlebars `{{…}}` passes through).
 *   - Line numbers, fold gutter, bracket matching, search (Ctrl+F).
 *   - Autocomplete: variables, helpers, snippets — triggered inside `{{…}}`
 *     blocks (and on Ctrl+Space anywhere).
 *   - Light/dark theme synced with `next-themes`.
 *   - Fills its parent container; pass `h-full` (etc.) on `className`.
 */
export function CodeEditor({
	value,
	onChange,
	className,
	readOnly,
	placeholder,
}: CodeEditorProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const extensions = useMemo(
		() => [
			html({ matchClosingTags: true, autoCloseTags: true }),
			EditorView.lineWrapping,
			autocompletion({
				override: [hbsCompletionSource],
				activateOnTyping: true,
			}),
			// Force the editor to fill its absolutely-positioned parent and
			// scroll internally instead of growing with content. Without these
			// rules CodeMirror picks the content's natural height and the
			// surrounding panel ends up unbounded.
			EditorView.theme({
				"&": { height: "100%", fontSize: "13px" },
				".cm-editor": { height: "100%" },
				".cm-scroller": {
					fontFamily: "ui-monospace, monospace",
					overflow: "auto",
				},
			}),
		],
		[],
	);

	return (
		<div
			className={`relative overflow-hidden rounded-md border border-input bg-input ${className ?? ""}`}
		>
			<div className="absolute inset-0">
				<CodeMirror
					value={value}
					onChange={onChange}
					extensions={extensions}
					editable={!readOnly}
					readOnly={readOnly}
					placeholder={placeholder}
					theme={isDark ? githubDark : githubLight}
					basicSetup={{
						lineNumbers: true,
						highlightActiveLine: true,
						foldGutter: true,
						autocompletion: false,
						searchKeymap: true,
						indentOnInput: true,
						bracketMatching: true,
						closeBrackets: true,
						highlightActiveLineGutter: true,
					}}
					height="100%"
					style={{ height: "100%" }}
				/>
			</div>
		</div>
	);
}

/**
 * Completion source for Handlebars constructs.
 *
 * Activates on `{{`, then offers:
 *   - block helpers (`if`, `each`, …) when the user typed `{{#`
 *   - regular helpers (`formatNumber`, `getAppreciation`, …) and variables
 *     when typing inside `{{…}}` (without leading `#`)
 *   - snippets (`each`, `header-bilingual`, …) — also offered, with
 *     placeholder cursor positions (`${0}`).
 *
 * The completion runs even outside `{{…}}` on explicit Ctrl+Space, but
 * automatic activation requires the cursor to be within an open `{{…`.
 */
function hbsCompletionSource(
	context: CompletionContext,
): CompletionResult | null {
	// Look back from the cursor for the nearest `{{` on this line.
	const line = context.state.doc.lineAt(context.pos);
	const textBeforeCursor = line.text.slice(0, context.pos - line.from);
	const openIdx = textBeforeCursor.lastIndexOf("{{");
	const closeIdx = textBeforeCursor.lastIndexOf("}}");

	const insideExpression = openIdx !== -1 && openIdx > closeIdx;
	if (!insideExpression && !context.explicit) return null;

	// Word being typed (handles dotted paths like `theme.fonts.`).
	const tokenMatch = /[#/]?[\w.]*$/.exec(
		insideExpression ? textBeforeCursor.slice(openIdx + 2) : textBeforeCursor,
	);
	const token = tokenMatch?.[0] ?? "";
	const tokenStart = context.pos - token.length;

	// `{{#…}}` → block helpers only.
	if (token.startsWith("#")) {
		return {
			from: tokenStart + 1, // after the `#`
			options: HBS_BLOCK_HELPERS.map(toCmCompletion),
			validFor: /^[\w.]*$/,
		};
	}

	// `{{/…}}` → close helper (just suggest the open block names).
	if (token.startsWith("/")) {
		return {
			from: tokenStart + 1,
			options: HBS_BLOCK_HELPERS.map(toCmCompletion),
			validFor: /^[\w.]*$/,
		};
	}

	const options: Completion[] = [
		...HBS_VARIABLES.map(toCmCompletion),
		...HBS_INLINE_HELPERS.map(toCmCompletion),
		...HBS_SNIPPETS.map((s) =>
			s.apply
				? snippetCompletion(s.apply, {
						label: s.label,
						type: "snippet",
						detail: s.detail,
					})
				: toCmCompletion(s),
		),
	];

	return {
		from: tokenStart,
		options,
		validFor: /^[\w.]*$/,
	};
}

function toCmCompletion(entry: {
	label: string;
	detail?: string;
	info?: string;
	apply?: string;
	type?: string;
}): Completion {
	return {
		label: entry.label,
		detail: entry.detail,
		info: entry.info,
		apply: entry.apply,
		type: entry.type,
	};
}
