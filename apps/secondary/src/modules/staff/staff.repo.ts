import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { staff } from "../../db/schema";

export async function findAll(institutionId: string) {
	return db
		.select()
		.from(staff)
		.where(eq(staff.institutionId, institutionId))
		.orderBy(staff.lastName, staff.firstName);
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(staff)
		.where(and(eq(staff.id, id), eq(staff.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function findByEmail(email: string, institutionId: string) {
	const rows = await db
		.select()
		.from(staff)
		.where(and(eq(staff.email, email), eq(staff.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof staff.$inferInsert) {
	const [row] = await db.insert(staff).values(data).returning();
	return row!;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<typeof staff.$inferInsert>,
) {
	const [row] = await db
		.update(staff)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(staff.id, id), eq(staff.institutionId, institutionId)))
		.returning();
	return row ?? null;
}

export async function countAll(institutionId: string) {
	const rows = await db
		.select({ id: staff.id })
		.from(staff)
		.where(eq(staff.institutionId, institutionId));
	return rows.length;
}
