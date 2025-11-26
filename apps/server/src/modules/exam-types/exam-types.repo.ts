import { eq, gt } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewExamType) {
	const [item] = await db.insert(schema.examTypes).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewExamType>) {
	const [item] = await db
		.update(schema.examTypes)
		.set(data)
		.where(eq(schema.examTypes.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.examTypes).where(eq(schema.examTypes.id, id));
}

export async function findById(id: string) {
	return db.query.examTypes.findFirst({ where: eq(schema.examTypes.id, id) });
}

export async function list(opts: { cursor?: string; limit?: number }) {
	const limit = opts.limit ?? 50;
	const condition = opts.cursor
		? gt(schema.examTypes.id, opts.cursor)
		: undefined;
	const items = await db
		.select()
		.from(schema.examTypes)
		.where(condition)
		.orderBy(schema.examTypes.name)
		.limit(limit);
	return paginate(items, limit);
}
