import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";

export async function findAll(institutionId: string) {
	return db
		.select()
		.from(subjects)
		.where(eq(subjects.institutionId, institutionId))
		.orderBy(subjects.name);
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(subjects)
		.where(and(eq(subjects.id, id), eq(subjects.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function findByCode(code: string, institutionId: string) {
	const rows = await db
		.select()
		.from(subjects)
		.where(
			and(eq(subjects.code, code), eq(subjects.institutionId, institutionId)),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof subjects.$inferInsert) {
	const [row] = await db.insert(subjects).values(data).returning();
	return row!;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<typeof subjects.$inferInsert>,
) {
	const [row] = await db
		.update(subjects)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(subjects.id, id), eq(subjects.institutionId, institutionId)))
		.returning();
	return row ?? null;
}
