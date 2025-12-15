import { and, eq, gt } from "drizzle-orm";
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
