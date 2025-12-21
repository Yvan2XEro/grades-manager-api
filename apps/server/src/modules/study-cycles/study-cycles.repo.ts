import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function createCycle(data: schema.NewStudyCycle) {
	const [cycle] = await db.insert(schema.studyCycles).values(data).returning();
	return cycle;
}

export async function updateCycle(
	id: string,
	institutionId: string,
	data: Partial<schema.NewStudyCycle>,
) {
	// First verify the cycle belongs to the institution
	const existing = await findCycleById(id, institutionId);
	if (!existing) return null;

	const [cycle] = await db
		.update(schema.studyCycles)
		.set(data)
		.where(eq(schema.studyCycles.id, id))
		.returning();
	return cycle;
}

export async function deleteCycle(id: string, institutionId: string) {
	// First verify the cycle belongs to the institution
	const existing = await findCycleById(id, institutionId);
	if (!existing) return;

	await db.delete(schema.studyCycles).where(eq(schema.studyCycles.id, id));
}

export async function findCycleById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(schema.studyCycles)
		.innerJoin(
			schema.faculties,
			eq(schema.studyCycles.facultyId, schema.faculties.id),
		)
		.where(
			and(
				eq(schema.studyCycles.id, id),
				eq(schema.faculties.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.study_cycles ?? null;
}

export async function listCycles(
	institutionId: string,
	opts: {
		facultyId?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.faculties.institutionId, institutionId),
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
		.select({
			id: schema.studyCycles.id,
			facultyId: schema.studyCycles.facultyId,
			code: schema.studyCycles.code,
			name: schema.studyCycles.name,
			description: schema.studyCycles.description,
			totalCreditsRequired: schema.studyCycles.totalCreditsRequired,
			durationYears: schema.studyCycles.durationYears,
			createdAt: schema.studyCycles.createdAt,
		})
		.from(schema.studyCycles)
		.innerJoin(
			schema.faculties,
			eq(schema.studyCycles.facultyId, schema.faculties.id),
		)
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
	institutionId: string,
	data: Partial<schema.NewCycleLevel>,
) {
	// First verify the level belongs to the institution
	const existing = await findLevelById(id, institutionId);
	if (!existing) return null;

	const [level] = await db
		.update(schema.cycleLevels)
		.set(data)
		.where(eq(schema.cycleLevels.id, id))
		.returning();
	return level;
}

export async function deleteLevel(id: string, institutionId: string) {
	// First verify the level belongs to the institution
	const existing = await findLevelById(id, institutionId);
	if (!existing) return;

	await db.delete(schema.cycleLevels).where(eq(schema.cycleLevels.id, id));
}

export async function findLevelById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(schema.cycleLevels)
		.innerJoin(
			schema.studyCycles,
			eq(schema.cycleLevels.cycleId, schema.studyCycles.id),
		)
		.innerJoin(
			schema.faculties,
			eq(schema.studyCycles.facultyId, schema.faculties.id),
		)
		.where(
			and(
				eq(schema.cycleLevels.id, id),
				eq(schema.faculties.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.cycle_levels ?? null;
}

export async function listLevels(cycleId: string, institutionId: string) {
	const rows = await db
		.select({
			id: schema.cycleLevels.id,
			cycleId: schema.cycleLevels.cycleId,
			orderIndex: schema.cycleLevels.orderIndex,
			code: schema.cycleLevels.code,
			name: schema.cycleLevels.name,
			minCredits: schema.cycleLevels.minCredits,
		})
		.from(schema.cycleLevels)
		.innerJoin(
			schema.studyCycles,
			eq(schema.cycleLevels.cycleId, schema.studyCycles.id),
		)
		.innerJoin(
			schema.faculties,
			eq(schema.studyCycles.facultyId, schema.faculties.id),
		)
		.where(
			and(
				eq(schema.cycleLevels.cycleId, cycleId),
				eq(schema.faculties.institutionId, institutionId),
			),
		)
		.orderBy(schema.cycleLevels.orderIndex);
	return rows;
}
