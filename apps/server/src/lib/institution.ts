import { asc } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

/**
 * Loads the first configured institution or throws if none exist.
 * Until Phase 3 introduces per-request scoping, we default to the
 * earliest institution row to keep legacy flows working.
 */
export async function requireDefaultInstitution() {
	let institution = await db.query.institutions.findFirst({
		orderBy: (institutions, { asc: ascFn }) => ascFn(institutions.createdAt),
	});
	if (!institution) {
		const [created] = await db
			.insert(schema.institutions)
			.values({
				code: "default",
				shortName: "DEFAULT",
				nameFr: "Institution par défaut",
				nameEn: "Default Institution",
			})
			.returning();
		institution = created;
	}
	return institution;
}

export async function requireDefaultInstitutionId() {
	const institution = await requireDefaultInstitution();
	return institution.id;
}

export async function ensureInstitutionScope<
	T extends { institutionId?: string | null },
>(data: T) {
	if (data.institutionId) {
		return data as T & { institutionId: string };
	}
	const institutionId = await requireDefaultInstitutionId();
	return { ...data, institutionId };
}
