/** Immutable path helpers and deep merge for document theme objects. */

export function setIn(
	obj: Record<string, unknown>,
	path: string[],
	val: unknown,
): Record<string, unknown> {
	if (path.length === 0) return obj;
	const [head, ...rest] = path;
	const current = (obj[head] ?? {}) as Record<string, unknown>;
	return {
		...obj,
		[head]:
			rest.length === 0
				? val
				: setIn(
						typeof current === "object" && current !== null ? current : {},
						rest,
						val,
					),
	};
}

export function getIn(obj: Record<string, unknown>, path: string[]): unknown {
	let cur: unknown = obj;
	for (const seg of path) {
		if (cur && typeof cur === "object" && seg in (cur as object)) {
			cur = (cur as Record<string, unknown>)[seg];
		} else {
			return undefined;
		}
	}
	return cur;
}

export function deepMergeTheme<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const out: Record<string, unknown> = { ...base };
	for (const [k, v] of Object.entries(override ?? {})) {
		const existing = (base as Record<string, unknown>)[k];
		if (
			v !== null &&
			typeof v === "object" &&
			!Array.isArray(v) &&
			existing &&
			typeof existing === "object" &&
			!Array.isArray(existing)
		) {
			out[k] = deepMergeTheme(
				existing as Record<string, unknown>,
				v as Record<string, unknown>,
			);
		} else {
			out[k] = v;
		}
	}
	return out as T;
}
