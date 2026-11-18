/**
 * Client-side template renderer (mirrors src/lib/template-renderer.ts).
 * Supports {{variable}}, {{nested.path}}, {{#each array}}…{{/each}} (nested ok).
 */

export interface TemplateData {
	[key: string]:
		| string
		| number
		| null
		| undefined
		| TemplateData
		| TemplateData[];
}

export function renderTemplate(html: string, data: TemplateData): string {
	let result = html;

	let match = /\{\{#each (\w+)\}\}/.exec(result);
	while (match) {
		const key = match[1];
		const blockStart = match.index + match[0].length;

		let depth = 1;
		let i = blockStart;
		while (i < result.length && depth > 0) {
			if (result.startsWith("{{#each", i) && i >= blockStart) depth++;
			if (result.startsWith("{{/each}}", i)) depth--;
			if (depth > 0) i++;
		}
		const blockEnd = i;
		const closeTagEnd = blockEnd + "{{/each}}".length;
		const block = result.slice(blockStart, blockEnd);

		const items = data[key];
		let replacement = "";
		if (Array.isArray(items)) {
			replacement = items
				.map((item) =>
					renderTemplate(block, { ...data, ...(item as TemplateData) }),
				)
				.join("");
		}

		result =
			result.slice(0, match.index) + replacement + result.slice(closeTagEnd);
		match = /\{\{#each (\w+)\}\}/.exec(result);
	}

	result = result.replace(/\{\{([\w.]+)\}\}/g, (placeholder, path: string) => {
		const parts = path.split(".");
		let val: unknown = data;
		for (const part of parts) {
			if (
				val === null ||
				val === undefined ||
				typeof val !== "object" ||
				Array.isArray(val)
			)
				return placeholder;
			val = (val as Record<string, unknown>)[part];
		}
		if (val === null || val === undefined) return "";
		if (typeof val === "object") return placeholder;
		return String(val);
	});

	return result;
}
