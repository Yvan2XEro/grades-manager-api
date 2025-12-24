import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewCourse) {
	const [item] = await db.insert(schema.courses).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewCourse>,
) {
	// First verify the course belongs to the institution
	const existing = await findById(id, institutionId);
	if (!existing) return null;

	const [item] = await db
		.update(schema.courses)
		.set(data)
		.where(eq(schema.courses.id, id))
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	// First verify the course belongs to the institution
	const existing = await findById(id, institutionId);
	if (!existing) return;

	await db.delete(schema.courses).where(eq(schema.courses.id, id));
}

export async function findById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
		.where(
			and(
				eq(schema.courses.id, id),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.courses ?? null;
}

export async function findByCode(
	code: string,
	programId: string,
	institutionId: string,
) {
	const result = await db
		.select()
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
		.where(
			and(
				eq(schema.courses.code, code),
				eq(schema.courses.program, programId),
				eq(schema.programs.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.courses ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		programId?: string;
		teachingUnitId?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.programs.institutionId, institutionId),
		opts.programId ? eq(schema.courses.program, opts.programId) : undefined,
		opts.teachingUnitId
			? eq(schema.courses.teachingUnitId, opts.teachingUnitId)
			: undefined,
		opts.cursor ? gt(schema.courses.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select({
			id: schema.courses.id,
			code: schema.courses.code,
			name: schema.courses.name,
			hours: schema.courses.hours,
			program: schema.courses.program,
			teachingUnitId: schema.courses.teachingUnitId,
			defaultTeacher: schema.courses.defaultTeacher,
			createdAt: schema.courses.createdAt,
		})
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
		.where(condition)
		.orderBy(schema.courses.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.id;
	}
	return { items, nextCursor };
}

export async function assignDefaultTeacher(
	courseId: string,
	institutionId: string,
	teacherId: string,
) {
	// First verify the course belongs to the institution
	const existing = await findById(courseId, institutionId);
	if (!existing) return null;

	const [item] = await db
		.update(schema.courses)
		.set({ defaultTeacher: teacherId })
		.where(eq(schema.courses.id, courseId))
		.returning();
	return item;
}

export async function search(
	institutionId: string,
	opts: {
		query: string;
		programId?: string;
		limit?: number;
	},
) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.courses.code, `%${opts.query}%`),
		ilike(schema.courses.name, `%${opts.query}%`),
	);
	const conditions = [
		eq(schema.programs.institutionId, institutionId),
		opts.programId ? eq(schema.courses.program, opts.programId) : undefined,
		searchCondition,
	].filter(Boolean) as (
		| ReturnType<typeof eq>
		| ReturnType<typeof or>
		| ReturnType<typeof and>
	)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);

	const rows = await db
		.select({
			id: schema.courses.id,
			code: schema.courses.code,
			name: schema.courses.name,
			hours: schema.courses.hours,
			program: schema.courses.program,
			teachingUnitId: schema.courses.teachingUnitId,
			defaultTeacher: schema.courses.defaultTeacher,
			createdAt: schema.courses.createdAt,
		})
		.from(schema.courses)
		.innerJoin(schema.programs, eq(schema.courses.program, schema.programs.id))
		.where(condition)
		.orderBy(schema.courses.code)
		.limit(limit);
	return rows;
}
