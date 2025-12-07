import { and, eq, gt, type SQL } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

const classSelection = {
	id: schema.classes.id,
	code: schema.classes.code,
	name: schema.classes.name,
	program: schema.classes.program,
	academicYear: schema.classes.academicYear,
	cycleLevelId: schema.classes.cycleLevelId,
	programOptionId: schema.classes.programOptionId,
	semesterId: schema.classes.semesterId,
	createdAt: schema.classes.createdAt,
	programInfo: {
		id: schema.programs.id,
		name: schema.programs.name,
		code: schema.programs.code,
		slug: schema.programs.slug,
		facultyId: schema.programs.faculty,
	},
	faculty: {
		id: schema.faculties.id,
		code: schema.faculties.code,
		name: schema.faculties.name,
	},
	academicYearInfo: {
		id: schema.academicYears.id,
		name: schema.academicYears.name,
		startDate: schema.academicYears.startDate,
		endDate: schema.academicYears.endDate,
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
	semester: {
		id: schema.semesters.id,
		code: schema.semesters.code,
		name: schema.semesters.name,
		orderIndex: schema.semesters.orderIndex,
	},
};

async function selectClass(where: SQL<unknown>) {
	const [klass] = await db
		.select(classSelection)
		.from(schema.classes)
		.leftJoin(schema.programs, eq(schema.programs.id, schema.classes.program))
		.leftJoin(
			schema.faculties,
			eq(schema.faculties.id, schema.programs.faculty),
		)
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
			eq(schema.studyCycles.id, schema.cycleLevels.cycleId),
		)
		.leftJoin(
			schema.programOptions,
			eq(schema.programOptions.id, schema.classes.programOptionId),
		)
		.leftJoin(
			schema.semesters,
			eq(schema.semesters.id, schema.classes.semesterId),
		)
		.where(where)
		.limit(1);
	return klass ?? null;
}

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
	return selectClass(eq(schema.classes.id, id));
}

export async function list(opts: {
	programId?: string;
	academicYearId?: string;
	facultyId?: string;
	cycleId?: string;
	cycleLevelId?: string;
	programOptionId?: string;
	semesterId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		opts.programId ? eq(schema.classes.program, opts.programId) : undefined,
		opts.academicYearId
			? eq(schema.classes.academicYear, opts.academicYearId)
			: undefined,
		opts.cycleLevelId
			? eq(schema.classes.cycleLevelId, opts.cycleLevelId)
			: undefined,
		opts.cycleId ? eq(schema.cycleLevels.cycleId, opts.cycleId) : undefined,
		opts.programOptionId
			? eq(schema.classes.programOptionId, opts.programOptionId)
			: undefined,
		opts.semesterId
			? eq(schema.classes.semesterId, opts.semesterId)
			: undefined,
		opts.facultyId ? eq(schema.programs.faculty, opts.facultyId) : undefined,
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
			schema.faculties,
			eq(schema.faculties.id, schema.programs.faculty),
		)
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
			eq(schema.studyCycles.id, schema.cycleLevels.cycleId),
		)
		.leftJoin(
			schema.programOptions,
			eq(schema.programOptions.id, schema.classes.programOptionId),
		)
		.leftJoin(
			schema.semesters,
			eq(schema.semesters.id, schema.classes.semesterId),
		)
		.where(condition)
		.orderBy(schema.classes.id)
		.limit(limit);
	return paginate(items, limit);
}

export async function findByCode(code: string, academicYearId: string) {
	return selectClass(
		and(
			eq(schema.classes.code, code),
			eq(schema.classes.academicYear, academicYearId),
		),
	);
}

export type KlassRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;
