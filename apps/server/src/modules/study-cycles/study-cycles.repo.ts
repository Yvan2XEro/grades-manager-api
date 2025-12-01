import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function createCycle(data: schema.NewStudyCycle) {
	const [cycle] = await db.insert(schema.studyCycles).values(data).returning();
	return cycle;
}

export async function updateCycle(
	id: string,
	data: Partial<schema.NewStudyCycle>,
) {
	const [cycle] = await db
		.update(schema.studyCycles)
		.set(data)
		.where(eq(schema.studyCycles.id, id))
		.returning();
	return cycle;
}

export async function deleteCycle(id: string) {
	await db.delete(schema.studyCycles).where(eq(schema.studyCycles.id, id));
}

export async function findCycleById(id: string) {
	return db.query.studyCycles.findFirst({
		where: eq(schema.studyCycles.id, id),
	});
}

export async function listCycles(opts: {
	facultyId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		opts.facultyId
			? eq(schema.studyCycles.facultyId, opts.facultyId)
			: undefined,
		opts.cursor ? gt(schema.studyCycles.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select()
		.from(schema.studyCycles)
		.where(condition)
		.orderBy(schema.studyCycles.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.id;
	}
	return { items, nextCursor };
}

export async function createLevel(data: schema.NewCycleLevel) {
	const [level] = await db.insert(schema.cycleLevels).values(data).returning();
	return level;
}

export async function updateLevel(
	id: string,
	data: Partial<schema.NewCycleLevel>,
) {
	const [level] = await db
		.update(schema.cycleLevels)
		.set(data)
		.where(eq(schema.cycleLevels.id, id))
		.returning();
	return level;
}

export async function deleteLevel(id: string) {
	await db.delete(schema.cycleLevels).where(eq(schema.cycleLevels.id, id));
}

export async function findLevelById(id: string) {
	return db.query.cycleLevels.findFirst({
		where: eq(schema.cycleLevels.id, id),
	});
}

export async function listLevels(cycleId: string) {
	return db.query.cycleLevels.findMany({
		where: eq(schema.cycleLevels.cycleId, cycleId),
		orderBy: (levels, helpers) => helpers.asc(levels.orderIndex),
	});
}
