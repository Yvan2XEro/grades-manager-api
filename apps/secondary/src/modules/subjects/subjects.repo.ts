import { and, asc, count, desc, eq, ilike, isNotNull } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";

export async function findAll(
	institutionId: string,
	opts: {
		search?: string;
		subjectGroup?: string;
		orderBy?: string;
		orderDir?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const {
		search,
		subjectGroup,
		orderBy = "name",
		orderDir = "asc",
		page = 1,
		pageSize = 25,
	} = opts;
	const conditions = [eq(subjects.institutionId, institutionId)];
	if (subjectGroup) conditions.push(eq(subjects.subjectGroup, subjectGroup));
	if (search) conditions.push(ilike(subjects.name, `%${search}%`));
	const where = and(...conditions);
	const col =
		orderBy === "code"
			? subjects.code
			: orderBy === "subjectGroup"
				? subjects.subjectGroup
				: subjects.name;
	const order = orderDir === "desc" ? desc(col) : asc(col);
	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(subjects)
			.where(where)
			.orderBy(order)
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

export async function distinctGroups(institutionId: string) {
	const rows = await db
		.selectDistinct({ subjectGroup: subjects.subjectGroup })
		.from(subjects)
		.where(
			and(
				eq(subjects.institutionId, institutionId),
				isNotNull(subjects.subjectGroup),
			),
		)
		.orderBy(asc(subjects.subjectGroup));
	return rows.map((r) => r.subjectGroup).filter(Boolean) as string[];
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
