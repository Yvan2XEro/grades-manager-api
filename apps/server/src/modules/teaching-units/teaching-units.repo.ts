import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function create(data: schema.NewTeachingUnit) {
	const [unit] = await db.insert(schema.teachingUnits).values(data).returning();
	return unit;
}

export async function update(
	id: string,
	data: Partial<schema.NewTeachingUnit>,
) {
	const [unit] = await db
		.update(schema.teachingUnits)
		.set(data)
		.where(eq(schema.teachingUnits.id, id))
		.returning();
	return unit;
}

export async function remove(id: string) {
	await db.delete(schema.teachingUnits).where(eq(schema.teachingUnits.id, id));
}

export async function findById(id: string) {
	return db.query.teachingUnits.findFirst({
		where: eq(schema.teachingUnits.id, id),
	});
}

export async function list(opts: {
	programId?: string;
	cursor?: string;
	limit?: number;
}) {
        const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
        const conditions = [
                opts.programId ? eq(schema.teachingUnits.programId, opts.programId) : undefined,
                opts.cursor ? gt(schema.teachingUnits.id, opts.cursor) : undefined,
        ].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
        const condition =
                conditions.length === 0
                        ? undefined
                        : conditions.length === 1
                                ? conditions[0]
                                : and(...conditions);
        const items = await db
                .select()
                .from(schema.teachingUnits)
		.where(condition)
		.orderBy(schema.teachingUnits.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	if (items.length > limit) {
		const nextItem = items.pop();
		nextCursor = nextItem?.id;
	}
	return { items, nextCursor };
}
