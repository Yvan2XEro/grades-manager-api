import { and, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { paginate } from "../_shared/pagination";

const classSelection = {
	id: schema.classes.id,
	institutionId: schema.classes.institutionId,
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

async function selectClass(where: SQL<unknown>, institutionId?: string) {
	const finalWhere = institutionId
		? and(eq(schema.classes.institutionId, institutionId), where)
		: where;
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
		.where(finalWhere)
		.limit(1);
	return klass ?? null;
}

export async function create(data: schema.NewKlass) {
	const [item] = await db.insert(schema.classes).values(data).returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewKlass>,
) {
	const [item] = await db
		.update(schema.classes)
		.set(data)
		.where(
			and(
				eq(schema.classes.id, id),
				eq(schema.classes.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.classes)
		.where(
			and(
				eq(schema.classes.id, id),
				eq(schema.classes.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId?: string) {
	return selectClass(eq(schema.classes.id, id), institutionId);
}

export async function list(
	institutionId: string,
	opts: {
		programId?: string;
		academicYearId?: string;
		cycleId?: string;
		cycleLevelId?: string;
		programOptionId?: string;
		semesterId?: string;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.classes.institutionId, institutionId),
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

export async function findByCode(
	code: string,
	academicYearId: string,
	institutionId: string,
) {
	return selectClass(
		and(
			eq(schema.classes.code, code),
			eq(schema.classes.academicYear, academicYearId),
		),
		institutionId,
	);
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
		ilike(schema.classes.code, `%${opts.query}%`),
		ilike(schema.classes.name, `%${opts.query}%`),
	);
	const condition = opts.programId
		? and(
				eq(schema.classes.program, opts.programId),
				eq(schema.classes.institutionId, institutionId),
				searchCondition,
			)
		: and(eq(schema.classes.institutionId, institutionId), searchCondition);

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
		.orderBy(schema.classes.code)
		.limit(limit);
	return items;
}

export type KlassRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;
