import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { terms } from "../../db/schema";

export async function findByYear(
	academicYearId: string,
	institutionId: string,
) {
	return db
		.select()
		.from(terms)
		.where(
			and(
				eq(terms.academicYearId, academicYearId),
				eq(terms.institutionId, institutionId),
			),
		)
		.orderBy(asc(terms.termNumber));
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(terms)
		.where(and(eq(terms.id, id), eq(terms.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function findByYearAndNumber(
	academicYearId: string,
	termNumber: number,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(terms)
		.where(
			and(
				eq(terms.academicYearId, academicYearId),
				eq(terms.termNumber, termNumber),
				eq(terms.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findActive(
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(terms)
		.where(
			and(
				eq(terms.academicYearId, academicYearId),
				eq(terms.institutionId, institutionId),
				eq(terms.status, "open"),
			),
		)
		.orderBy(asc(terms.termNumber))
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof terms.$inferInsert) {
	const [row] = await db.insert(terms).values(data).returning();
	return row!;
}

export async function setStatus(
	id: string,
	institutionId: string,
	status: "open" | "closed" | "archived",
) {
	const [row] = await db
		.update(terms)
		.set({ status, updatedAt: new Date() })
		.where(and(eq(terms.id, id), eq(terms.institutionId, institutionId)))
		.returning();
	return row ?? null;
}
