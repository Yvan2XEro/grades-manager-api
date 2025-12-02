import { and, eq, gt, inArray } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

const classSelection = {
	id: schema.classes.id,
	name: schema.classes.name,
	program: schema.classes.program,
	academicYear: schema.classes.academicYear,
	cycleLevelId: schema.classes.cycleLevelId,
	programOptionId: schema.classes.programOptionId,
	createdAt: schema.classes.createdAt,
	programInfo: {
		id: schema.programs.id,
		name: schema.programs.name,
		cycleId: schema.programs.cycleId,
		facultyId: schema.programs.faculty,
	},
	academicYearInfo: {
		id: schema.academicYears.id,
		name: schema.academicYears.name,
	},
	cycleLevel: {
		id: schema.cycleLevels.id,
		name: schema.cycleLevels.name,
		code: schema.cycleLevels.code,
		orderIndex: schema.cycleLevels.orderIndex,
		minCredits: schema.cycleLevels.minCredits,
	},
	cycle: {
		id: schema.studyCycles.id,
		name: schema.studyCycles.name,
		code: schema.studyCycles.code,
	},
	programOption: {
		id: schema.programOptions.id,
		name: schema.programOptions.name,
		code: schema.programOptions.code,
	},
};

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
	const [klass] = await db
		.select(classSelection)
		.from(schema.classes)
		.leftJoin(schema.programs, eq(schema.programs.id, schema.classes.program))
		.leftJoin(
			schema.academicYears,
			eq(schema.academicYears.id, schema.classes.academicYear),
		)
		.leftJoin(
			schema.cycleLevels,
			eq(schema.cycleLevels.id, schema.classes.cycleLevelId),
		)
		.leftJoin(
			schema.studyCycles,
			eq(schema.studyCycles.id, schema.programs.cycleId),
		)
		.leftJoin(
			schema.programOptions,
			eq(schema.programOptions.id, schema.classes.programOptionId),
		)
		.where(eq(schema.classes.id, id))
		.limit(1);
	return klass ?? null;
}

export async function list(opts: {
	programId?: string;
	academicYearId?: string;
	facultyId?: string;
	cycleId?: string;
	cycleLevelId?: string;
	programOptionId?: string;
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
		opts.programOptionId
			? eq(schema.classes.programOptionId, opts.programOptionId)
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
		.select(classSelection)
		.from(schema.classes)
		.leftJoin(schema.programs, eq(schema.programs.id, schema.classes.program))
		.leftJoin(
			schema.academicYears,
			eq(schema.academicYears.id, schema.classes.academicYear),
		)
		.leftJoin(
			schema.cycleLevels,
			eq(schema.cycleLevels.id, schema.classes.cycleLevelId),
		)
		.leftJoin(
			schema.studyCycles,
			eq(schema.studyCycles.id, schema.programs.cycleId),
		)
		.leftJoin(
			schema.programOptions,
			eq(schema.programOptions.id, schema.classes.programOptionId),
		)
		.where(condition)
		.orderBy(schema.classes.id)
		.limit(limit);
	return paginate(items, limit);
}
