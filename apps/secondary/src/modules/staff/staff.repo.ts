import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { staff } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: {
		search?: string;
		role?: string;
		orderBy?: string;
		orderDir?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const {
		search,
		role,
		orderBy = "lastName",
		orderDir = "asc",
		page = 1,
		pageSize = 25,
	} = opts;
	const conditions = [eq(staff.institutionId, institutionId)];
	if (role) conditions.push(eq(staff.role, role));
	if (search) {
		conditions.push(
			or(
				ilike(staff.firstName, `%${search}%`),
				ilike(staff.lastName, `%${search}%`),
				ilike(staff.email, `%${search}%`),
			)!,
		);
	}
	const where = and(...conditions);
	const col =
		orderBy === "firstName"
			? staff.firstName
			: orderBy === "email"
				? staff.email
				: staff.lastName;
	const order = orderDir === "desc" ? desc(col) : asc(col);
	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(staff)
			.where(where)
			.orderBy(order)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: count() }).from(staff).where(where),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
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

export async function bulkInsert(rows: (typeof staff.$inferInsert)[]) {
	if (rows.length === 0) return [];
	return db.insert(staff).values(rows).onConflictDoNothing().returning();
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
