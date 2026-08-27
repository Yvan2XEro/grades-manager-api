import { and, count, eq, ilike } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: { search?: string; page?: number; pageSize?: number } = {},
) {
	const { search, page = 1, pageSize = 25 } = opts;
	const where = search
		? and(
				eq(subjects.institutionId, institutionId),
				ilike(subjects.name, `%${search}%`),
			)
		: eq(subjects.institutionId, institutionId);
	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(subjects)
			.where(where)
			.orderBy(subjects.name)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: count() }).from(subjects).where(where),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
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
