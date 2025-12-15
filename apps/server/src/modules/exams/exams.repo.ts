import { and, eq, gt, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewExam) {
	const [item] = await db.insert(schema.exams).values(data).returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewExam>,
	institutionId: string,
) {
	const [item] = await db
		.update(schema.exams)
		.set(data)
		.where(
			and(
				eq(schema.exams.id, id),
				eq(schema.exams.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.exams)
		.where(
			and(
				eq(schema.exams.id, id),
				eq(schema.exams.institutionId, institutionId),
			),
		);
}

export async function findById(id: string) {
	return db.query.exams.findFirst({ where: eq(schema.exams.id, id) });
}

export async function list(opts: {
	institutionId: string;
	classCourseId?: string;
	dateFrom?: Date;
	dateTo?: Date;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	let condition: unknown = eq(schema.exams.institutionId, opts.institutionId);
	if (opts.classCourseId) {
		const classCond = eq(schema.exams.classCourse, opts.classCourseId);
		condition = condition ? and(condition, classCond) : classCond;
	}
	if (opts.dateFrom) {
		const c = gte(schema.exams.date, opts.dateFrom);
		condition = condition ? and(condition, c) : c;
	}
	if (opts.dateTo) {
		const c = lte(schema.exams.date, opts.dateTo);
		condition = condition ? and(condition, c) : c;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.exams.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.exams)
		.where(condition)
		.orderBy(schema.exams.id)
		.limit(limit);
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;
	return { items, nextCursor };
}

export async function setLock(
	examId: string,
	lock: boolean,
	institutionId: string,
) {
	const [item] = await db
		.update(schema.exams)
		.set({ isLocked: lock })
		.where(
			and(
				eq(schema.exams.id, examId),
				eq(schema.exams.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function assignScheduleRun(
	examIds: string[],
	runId: string,
	institutionId: string,
) {
	if (examIds.length === 0) return;
	await db
		.update(schema.exams)
		.set({ scheduleRunId: runId })
		.where(
			and(
				inArray(schema.exams.id, examIds),
				eq(schema.exams.institutionId, institutionId),
			),
		);
}
