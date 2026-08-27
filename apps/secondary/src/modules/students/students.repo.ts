import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { students } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: { search?: string; limit?: number; offset?: number },
) {
	const { search, limit = 50, offset = 0 } = opts;
	const where = search
		? and(
				eq(students.institutionId, institutionId),
				or(
					ilike(students.firstName, `%${search}%`),
					ilike(students.lastName, `%${search}%`),
					ilike(students.mnu, `%${search}%`),
				),
			)
		: eq(students.institutionId, institutionId);
	return db
		.select()
		.from(students)
		.where(where)
		.orderBy(students.lastName, students.firstName)
		.limit(limit)
		.offset(offset);
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(students)
		.where(and(eq(students.id, id), eq(students.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof students.$inferInsert) {
	const [row] = await db.insert(students).values(data).returning();
	return row!;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<typeof students.$inferInsert>,
) {
	const [row] = await db
		.update(students)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(students.id, id), eq(students.institutionId, institutionId)))
		.returning();
	return row ?? null;
}

export async function countAll(institutionId: string) {
	const rows = await db
		.select({ id: students.id })
		.from(students)
		.where(eq(students.institutionId, institutionId));
	return rows.length;
}
