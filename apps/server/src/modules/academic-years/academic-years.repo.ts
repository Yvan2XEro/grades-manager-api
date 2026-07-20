import { and, count, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewAcademicYear) {
	const [item] = await db.insert(schema.academicYears).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewAcademicYear>,
) {
	const [item] = await db
		.update(schema.academicYears)
		.set(data)
		.where(
			and(
				eq(schema.academicYears.id, id),
				eq(schema.academicYears.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function countClasses(academicYearId: string): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(schema.classes)
		.where(eq(schema.classes.academicYear, academicYearId));
	return row?.n ?? 0;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.academicYears)
		.where(
			and(
				eq(schema.academicYears.id, id),
				eq(schema.academicYears.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	return db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, id),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
}

export async function findActive(institutionId: string) {
	return db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.institutionId, institutionId),
			eq(schema.academicYears.isActive, true),
		),
	});
}

export async function list(
	institutionId: string,
	opts: { cursor?: string; limit?: number },
) {
	const limit = opts.limit ?? 50;
	const cursorCond = opts.cursor
		? gt(schema.academicYears.id, opts.cursor)
		: null;
	const condition = cursorCond
		? and(eq(schema.academicYears.institutionId, institutionId), cursorCond)
		: eq(schema.academicYears.institutionId, institutionId);
	const items = await db
		.select()
		.from(schema.academicYears)
		.where(condition)
		.orderBy(schema.academicYears.id)
		.limit(limit);
	return paginate(items, limit);
}

export async function listPaged(
	institutionId: string,
	opts: { page: number; pageSize: number },
) {
	const size = Math.min(Math.max(opts.pageSize, 1), 100);
	const offset = (Math.max(opts.page, 1) - 1) * size;
	const where = eq(schema.academicYears.institutionId, institutionId);

	const [rows, [{ total }]] = await Promise.all([
		db
			.select()
			.from(schema.academicYears)
			.where(where)
			.orderBy(schema.academicYears.startDate, schema.academicYears.id)
			.limit(size)
			.offset(offset),
		db.select({ total: count() }).from(schema.academicYears).where(where),
	]);
	const totalCount = Number(total ?? 0);
	return {
		items: rows,
		total: totalCount,
		pageCount: Math.ceil(totalCount / size),
	};
}
