export function slugify(value: string) {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
	return normalized.length ? normalized : "program";
}

export function normalizeCode(value: string) {
	return value.trim().toUpperCase();
}
