import { and, eq, gt, ilike } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

const programSelection = {
	id: schema.programs.id,
	name: schema.programs.name,
	description: schema.programs.description,
	faculty: schema.programs.faculty,
	cycleId: schema.programs.cycleId,
	createdAt: schema.programs.createdAt,
	cycle: {
		id: schema.studyCycles.id,
		name: schema.studyCycles.name,
		code: schema.studyCycles.code,
		totalCreditsRequired: schema.studyCycles.totalCreditsRequired,
		durationYears: schema.studyCycles.durationYears,
	},
	facultyInfo: {
		id: schema.faculties.id,
		name: schema.faculties.name,
	},
};

export async function create(data: schema.NewProgram) {
	const [item] = await db.insert(schema.programs).values(data).returning();
	return item;
}

export async function update(id: string, data: Partial<schema.NewProgram>) {
	const [item] = await db
		.update(schema.programs)
		.set(data)
		.where(eq(schema.programs.id, id))
		.returning();
	return item;
}

export async function remove(id: string) {
	await db.delete(schema.programs).where(eq(schema.programs.id, id));
}

export async function findById(id: string) {
	const [program] = await db
		.select(programSelection)
		.from(schema.programs)
		.leftJoin(
			schema.studyCycles,
			eq(schema.studyCycles.id, schema.programs.cycleId),
		)
		.leftJoin(schema.faculties, eq(schema.faculties.id, schema.programs.faculty))
		.where(eq(schema.programs.id, id))
		.limit(1);
	return program ?? null;
}

export async function list(opts: {
	facultyId?: string;
	cycleId?: string;
	q?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	let condition: unknown;
	if (opts.facultyId) {
		condition = eq(schema.programs.faculty, opts.facultyId);
	}
	if (opts.cycleId) {
		const cycleCond = eq(schema.programs.cycleId, opts.cycleId);
		condition = condition ? and(condition, cycleCond) : cycleCond;
	}
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
		.leftJoin(
			schema.studyCycles,
			eq(schema.studyCycles.id, schema.programs.cycleId),
		)
		.leftJoin(schema.faculties, eq(schema.faculties.id, schema.programs.faculty))
		.where(condition)
		.orderBy(schema.programs.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}
