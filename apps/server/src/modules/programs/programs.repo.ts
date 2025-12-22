import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

const programSelection = {
	id: schema.programs.id,
	institutionId: schema.programs.institutionId,
	code: schema.programs.code,
	name: schema.programs.name,
	description: schema.programs.description,
	createdAt: schema.programs.createdAt,
};

export async function create(data: schema.NewProgram) {
	const [item] = await db.insert(schema.programs).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewProgram>,
) {
	const [item] = await db
		.update(schema.programs)
		.set(data)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.programs)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	const [program] = await db
		.select(programSelection)
		.from(schema.programs)
		.where(
			and(
				eq(schema.programs.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return program ?? null;
}

export async function findByCode(code: string, institutionId: string) {
	const [program] = await db
		.select(programSelection)
		.from(schema.programs)
		.where(
			and(
				eq(schema.programs.code, code),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return program ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		q?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = opts.limit ?? 50;
	let condition:
		| ReturnType<typeof eq>
		| ReturnType<typeof and>
		| ReturnType<typeof gt>
		| undefined = eq(schema.programs.institutionId, institutionId);
	if (opts.q) {
		const qCond = ilike(schema.programs.name, `%${opts.q}%`);
		condition = condition ? and(condition, qCond) : qCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.programs.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select(programSelection)
		.from(schema.programs)
		.where(condition)
		.orderBy(schema.programs.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function search(opts: {
	query: string;
	limit?: number;
	institutionId: string;
}) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.programs.code, `%${opts.query}%`),
		ilike(schema.programs.name, `%${opts.query}%`),
	);
	const condition = and(
		eq(schema.programs.institutionId, opts.institutionId),
		searchCondition,
	);

	const items = await db
		.select(programSelection)
		.from(schema.programs)
		.where(condition)
		.orderBy(schema.programs.code)
		.limit(limit);
	return items;
}
