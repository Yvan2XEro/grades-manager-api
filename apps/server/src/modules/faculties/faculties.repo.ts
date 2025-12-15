import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewFaculty) {
	const [item] = await db.insert(schema.faculties).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewFaculty>,
) {
	const [item] = await db
		.update(schema.faculties)
		.set(data)
		.where(
			and(
				eq(schema.faculties.id, id),
				eq(schema.faculties.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.faculties)
		.where(
			and(
				eq(schema.faculties.id, id),
				eq(schema.faculties.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId: string) {
	return db.query.faculties.findFirst({
		where: and(
			eq(schema.faculties.id, id),
			eq(schema.faculties.institutionId, institutionId),
		),
	});
}

export async function findByCode(code: string, institutionId: string) {
	return db.query.faculties.findFirst({
		where: and(
			eq(schema.faculties.code, code),
			eq(schema.faculties.institutionId, institutionId),
		),
	});
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
		| undefined = eq(schema.faculties.institutionId, institutionId);
	if (opts.q) {
		const qCond = ilike(schema.faculties.name, `%${opts.q}%`);
		condition = condition ? and(condition, qCond) : qCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.faculties.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.faculties)
		.where(condition)
		.orderBy(schema.faculties.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function search(opts: {
	query: string;
	institutionId: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 20;
	const items = await db
		.select()
		.from(schema.faculties)
		.where(
			or(
				and(
					ilike(schema.faculties.code, `%${opts.query}%`),
					eq(schema.faculties.institutionId, opts.institutionId),
				),
				and(
					ilike(schema.faculties.name, `%${opts.query}%`),
					eq(schema.faculties.institutionId, opts.institutionId),
				),
			),
		)
		.orderBy(schema.faculties.code)
		.limit(limit);
	return items;
}
