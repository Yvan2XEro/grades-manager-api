import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function create(data: schema.NewTeachingUnit) {
	const [unit] = await db.insert(schema.teachingUnits).values(data).returning();
	return unit;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewTeachingUnit>,
) {
	// First verify the unit belongs to the institution
	const existing = await findById(id, institutionId);
	if (!existing) return null;

	const [unit] = await db
		.update(schema.teachingUnits)
		.set(data)
		.where(eq(schema.teachingUnits.id, id))
		.returning();
	return unit;
}

export async function remove(id: string, institutionId: string) {
	// First verify the unit belongs to the institution
	const existing = await findById(id, institutionId);
	if (!existing) return;

	await db.delete(schema.teachingUnits).where(eq(schema.teachingUnits.id, id));
}

export async function findById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(schema.teachingUnits)
		.innerJoin(
			schema.programs,
			eq(schema.teachingUnits.programId, schema.programs.id),
		)
		.where(
			and(
				eq(schema.teachingUnits.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.teaching_units ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		programId?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.programs.institutionId, institutionId),
		opts.programId
			? eq(schema.teachingUnits.programId, opts.programId)
			: undefined,
		opts.cursor ? gt(schema.teachingUnits.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select({
			id: schema.teachingUnits.id,
			programId: schema.teachingUnits.programId,
			name: schema.teachingUnits.name,
			code: schema.teachingUnits.code,
			description: schema.teachingUnits.description,
			credits: schema.teachingUnits.credits,
			semester: schema.teachingUnits.semester,
			createdAt: schema.teachingUnits.createdAt,
		})
		.from(schema.teachingUnits)
		.innerJoin(
			schema.programs,
			eq(schema.teachingUnits.programId, schema.programs.id),
		)
		.where(condition)
		.orderBy(schema.teachingUnits.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.id;
	}
	return { items, nextCursor };
}
