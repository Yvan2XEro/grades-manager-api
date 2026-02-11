import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewExamType) {
	const [item] = await db.insert(schema.examTypes).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewExamType>,
) {
	const [item] = await db
		.update(schema.examTypes)
		.set(data)
		.where(
			and(
				eq(schema.examTypes.id, id),
				eq(schema.examTypes.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.examTypes)
		.where(
			and(
				eq(schema.examTypes.id, id),
				eq(schema.examTypes.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	return db.query.examTypes.findFirst({
		where: and(
			eq(schema.examTypes.id, id),
			eq(schema.examTypes.institutionId, institutionId),
		),
	});
}

export async function list(
	institutionId: string,
	opts: { cursor?: string; limit?: number },
) {
	const limit = opts.limit ?? 50;
	const cursorCond = opts.cursor ? gt(schema.examTypes.id, opts.cursor) : null;
	const condition = cursorCond
		? and(eq(schema.examTypes.institutionId, institutionId), cursorCond)
		: eq(schema.examTypes.institutionId, institutionId);
	const items = await db
		.select()
		.from(schema.examTypes)
		.where(condition)
		.orderBy(schema.examTypes.name)
		.limit(limit);
	return paginate(items, limit);
}
