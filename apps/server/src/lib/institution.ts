import type { Context } from "./context";

/**
 * Helper to extract institutionId from context.
 * This ensures we always use the tenant-scoped institution from the resolved context.
 */
export function getInstitutionId(ctx: Context): string {
	if (!ctx.institution?.id) {
		throw new Error(
			"Institution not available in context. This should not happen after tenant resolution.",
		);
	}
	return ctx.institution.id;
}

/**
 * Ensure data has an institutionId, using the context's institution as fallback.
 */
export function ensureInstitutionScope<
	T extends { institutionId?: string | null },
>(data: T, ctx: Context): T & { institutionId: string } {
	if (data.institutionId) {
		return data as T & { institutionId: string };
	}
	return { ...data, institutionId: getInstitutionId(ctx) };
}
