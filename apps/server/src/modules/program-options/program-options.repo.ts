import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function create(data: schema.NewProgramOption) {
	const [option] = await db
		.insert(schema.programOptions)
		.values(data)
		.returning();
	return option;
}

export async function update(
	id: string,
	data: Partial<schema.NewProgramOption>,
) {
	const [option] = await db
		.update(schema.programOptions)
		.set(data)
		.where(eq(schema.programOptions.id, id))
		.returning();
	return option;
}

export async function remove(id: string) {
	await db
		.delete(schema.programOptions)
		.where(eq(schema.programOptions.id, id));
}

export async function findById(id: string) {
	return db.query.programOptions.findFirst({
		where: eq(schema.programOptions.id, id),
	});
}

export async function list(opts: {
	programId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		opts.programId
			? eq(schema.programOptions.programId, opts.programId)
			: undefined,
		opts.cursor ? gt(schema.programOptions.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select()
		.from(schema.programOptions)
		.where(condition)
		.orderBy(schema.programOptions.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.id;
	}
	return { items, nextCursor };
}
