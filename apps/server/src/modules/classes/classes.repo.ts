import { and, eq, gt, inArray } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

export async function create(data: schema.NewKlass) {
	const [item] = await db.insert(schema.classes).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewKlass>) {
	const [item] = await db
		.update(schema.classes)
		.set(data)
		.where(eq(schema.classes.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.classes).where(eq(schema.classes.id, id));
}

export async function findById(id: string) {
	return db.query.classes.findFirst({ where: eq(schema.classes.id, id) });
}

export async function list(opts: {
	programId?: string;
	academicYearId?: string;
	facultyId?: string;
	cycleId?: string;
	cycleLevelId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	let facultyProgramIds: string[] | undefined;
	if (opts.facultyId) {
		const programs = await db
			.select({ id: schema.programs.id })
			.from(schema.programs)
			.where(eq(schema.programs.faculty, opts.facultyId));
		if (!programs.length) {
			return { items: [], nextCursor: undefined };
		}
		facultyProgramIds = programs.map((p) => p.id);
	}
	let cycleProgramIds: string[] | undefined;
	if (opts.cycleId) {
		const programs = await db
			.select({ id: schema.programs.id })
			.from(schema.programs)
			.where(eq(schema.programs.cycleId, opts.cycleId));
		if (!programs.length) {
			return { items: [], nextCursor: undefined };
		}
		cycleProgramIds = programs.map((p) => p.id);
	}
	const conditions = [
		opts.programId ? eq(schema.classes.program, opts.programId) : undefined,
		opts.academicYearId
			? eq(schema.classes.academicYear, opts.academicYearId)
			: undefined,
		opts.cycleLevelId
			? eq(schema.classes.cycleLevelId, opts.cycleLevelId)
			: undefined,
		facultyProgramIds
			? inArray(schema.classes.program, facultyProgramIds)
			: undefined,
		cycleProgramIds
			? inArray(schema.classes.program, cycleProgramIds)
			: undefined,
		opts.cursor ? gt(schema.classes.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const items = await db
		.select()
		.from(schema.classes)
		.where(condition)
		.orderBy(schema.classes.id)
		.limit(limit);
	return paginate(items, limit);
}
