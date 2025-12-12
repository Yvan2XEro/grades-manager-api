import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewCourse) {
	const [item] = await db.insert(schema.courses).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewCourse>) {
	const [item] = await db
		.update(schema.courses)
		.set(data)
		.where(eq(schema.courses.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.courses).where(eq(schema.courses.id, id));
}

export async function findById(id: string) {
	return db.query.courses.findFirst({ where: eq(schema.courses.id, id) });
}

export async function findByCode(code: string, programId: string) {
	return db.query.courses.findFirst({
		where: and(
			eq(schema.courses.code, code),
			eq(schema.courses.program, programId),
		),
	});
}

export async function list(opts: {
	programId?: string;
	teachingUnitId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	// biome-ignore lint/suspicious/noImplicitAnyLet: dynamic condition
	let condition;
	if (opts.programId) {
		condition = eq(schema.courses.program, opts.programId);
	}
	if (opts.teachingUnitId) {
		const unitCond = eq(schema.courses.teachingUnitId, opts.teachingUnitId);
		condition = condition ? and(condition, unitCond) : unitCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.courses.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.courses)
		.where(condition)
		.orderBy(schema.courses.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function assignDefaultTeacher(
	courseId: string,
	teacherId: string,
) {
	const [item] = await db
		.update(schema.courses)
		.set({ defaultTeacher: teacherId })
		.where(eq(schema.courses.id, courseId))
		.returning();
	return item;
}

export async function search(opts: {
	query: string;
	programId?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.courses.code, `%${opts.query}%`),
		ilike(schema.courses.name, `%${opts.query}%`),
	);
	const condition = opts.programId
		? and(eq(schema.courses.program, opts.programId), searchCondition)
		: searchCondition;

	const items = await db
		.select()
		.from(schema.courses)
		.where(condition)
		.orderBy(schema.courses.code)
		.limit(limit);
	return items;
}
