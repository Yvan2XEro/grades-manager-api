/**
 * Minimal {{variable}} template renderer.
 * Replaces all {{key}} occurrences with values from the data map.
 * Unknown keys are left as-is (no error).
 */
export function renderTemplate(
	html: string,
	data: Record<string, string | number | null | undefined>,
): string {
	return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		const val = data[key];
		if (val === null || val === undefined) return match;
		return String(val);
	});
}

/**
 * Returns the list of variable names found in a template string.
 */
export function extractTemplateVars(html: string): string[] {
	const found = new Set<string>();
	for (const [, key] of html.matchAll(/\{\{(\w+)\}\}/g)) {
		found.add(key);
	}
	return [...found];
}
