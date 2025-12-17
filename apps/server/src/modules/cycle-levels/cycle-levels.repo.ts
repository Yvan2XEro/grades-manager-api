import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewCycleLevel) {
	const [item] = await db.insert(schema.cycleLevels).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewCycleLevel>) {
	const [item] = await db
		.update(schema.cycleLevels)
		.set(data)
		.where(eq(schema.cycleLevels.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.cycleLevels).where(eq(schema.cycleLevels.id, id));
}

export async function findById(id: string) {
	return db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.id, id),
	});
}

export async function findByCode(code: string, cycleId: string) {
	return db.query.cycleLevels.findFirst({
		where: and(
			eq(schema.cycleLevels.code, code),
			eq(schema.cycleLevels.cycleId, cycleId),
		),
	});
}

export async function list(opts: {
	cycleId?: string;
	q?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	let condition: unknown;
	if (opts.cycleId) {
		condition = eq(schema.cycleLevels.cycleId, opts.cycleId);
	}
	if (opts.q) {
		const qCond = ilike(schema.cycleLevels.name, `%${opts.q}%`);
		condition = condition ? and(condition, qCond) : qCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.cycleLevels.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.cycleLevels)
		.where(condition)
		.orderBy(schema.cycleLevels.orderIndex)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function search(opts: {
	query: string;
	cycleId?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.cycleLevels.code, `%${opts.query}%`),
		ilike(schema.cycleLevels.name, `%${opts.query}%`),
	);
	const condition = opts.cycleId
		? and(eq(schema.cycleLevels.cycleId, opts.cycleId), searchCondition)
		: searchCondition;

	const items = await db
		.select()
		.from(schema.cycleLevels)
		.where(condition)
		.orderBy(schema.cycleLevels.code)
		.limit(limit);
	return items;
}
