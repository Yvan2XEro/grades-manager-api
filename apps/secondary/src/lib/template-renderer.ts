/**
 * Template renderer supporting:
 *   {{variable}}              — scalar substitution
 *   {{nested.path}}           — dot-path traversal
 *   {{#each key}}…{{/each}}  — loop over array (nested loops supported)
 *
 * Inside a loop, child context is merged with parent so parent variables
 * remain accessible inside the block.
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
	// Process {{#each}} blocks iteratively (left-to-right, outermost first),
	// using a depth counter to find the correctly matching {{/each}}.
	let result = html;

	let match = /\{\{#each (\w+)\}\}/.exec(result);
	while (match) {
		const key = match[1];
		const blockStart = match.index + match[0].length;

		// Walk forward to find the balanced {{/each}}
		let depth = 1;
		let i = blockStart;
		while (i < result.length && depth > 0) {
			if (result.startsWith("{{#each", i) && i > blockStart - match[0].length) {
				// Only count nested opens that are after the current block starts
				if (i >= blockStart) depth++;
			}
			if (result.startsWith("{{/each}}", i)) depth--;
			if (depth > 0) i++;
		}
		const blockEnd = i; // points to first char of {{/each}}
		const closeTagEnd = blockEnd + "{{/each}}".length;
		const block = result.slice(blockStart, blockEnd);

		const items = data[key];
		let replacement = "";
		if (Array.isArray(items)) {
			replacement = items
				.map((item) =>
					renderTemplate(block, {
						...data,
						...(item as TemplateData),
					}),
				)
				.join("");
		}

		result =
			result.slice(0, match.index) + replacement + result.slice(closeTagEnd);
		match = /\{\{#each (\w+)\}\}/.exec(result);
	}

	// Process {{variable}} and {{a.b.c}} scalar replacements
	result = result.replace(/\{\{([\w.]+)\}\}/g, (placeholder, path: string) => {
		const parts = path.split(".");
		let val: unknown = data;
		for (const part of parts) {
			if (
				val === null ||
				val === undefined ||
				typeof val !== "object" ||
				Array.isArray(val)
			) {
				return placeholder;
			}
			val = (val as Record<string, unknown>)[part];
		}
		if (val === null || val === undefined) return "";
		if (typeof val === "object") return placeholder;
		return String(val);
	});

	return result;
}

export function extractTemplateVars(html: string): string[] {
	const found = new Set<string>();
	for (const [, key] of html.matchAll(/\{\{([\w.]+)\}\}/g)) {
		found.add(key);
	}
	return [...found];
}
