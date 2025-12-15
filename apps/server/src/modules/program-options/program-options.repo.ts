import { and, eq, gt, ilike, or } from "drizzle-orm";
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
	institutionId: string,
	data: Partial<schema.NewProgramOption>,
) {
	const [option] = await db
		.update(schema.programOptions)
		.set(data)
		.where(
			and(
				eq(schema.programOptions.id, id),
				eq(schema.programOptions.institutionId, institutionId),
			),
		)
		.returning();
	return option;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.programOptions)
		.where(
			and(
				eq(schema.programOptions.id, id),
				eq(schema.programOptions.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	return db.query.programOptions.findFirst({
		where: and(
			eq(schema.programOptions.id, id),
			eq(schema.programOptions.institutionId, institutionId),
		),
	});
}

export async function list(
	opts: {
		programId?: string;
		cursor?: string;
		limit?: number;
	},
	institutionId: string,
) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.programOptions.institutionId, institutionId),
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

export async function search(
	opts: {
		query: string;
		programId?: string;
		limit?: number;
	},
	institutionId: string,
) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.programOptions.code, `%${opts.query}%`),
		ilike(schema.programOptions.name, `%${opts.query}%`),
	);
	const condition = opts.programId
		? and(
				eq(schema.programOptions.programId, opts.programId),
				eq(schema.programOptions.institutionId, institutionId),
				searchCondition,
			)
		: and(
				eq(schema.programOptions.institutionId, institutionId),
				searchCondition,
			);

	const items = await db
		.select()
		.from(schema.programOptions)
		.where(condition)
		.orderBy(schema.programOptions.code)
		.limit(limit);
	return items;
}
