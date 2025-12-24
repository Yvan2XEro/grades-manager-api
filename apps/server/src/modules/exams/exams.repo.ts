import { and, asc, eq, gt, gte, ilike, inArray, lte, or } from "drizzle-orm";
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
	query?: string;
	academicYearId?: string;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.exams.institutionId, opts.institutionId),
		opts.classCourseId ? eq(schema.exams.classCourse, opts.classCourseId) : undefined,
		opts.dateFrom ? gte(schema.exams.date, opts.dateFrom) : undefined,
		opts.dateTo ? lte(schema.exams.date, opts.dateTo) : undefined,
		opts.cursor ? gt(schema.exams.id, opts.cursor) : undefined,
		opts.academicYearId
			? eq(schema.classes.academicYear, opts.academicYearId)
			: undefined,
		opts.classId ? eq(schema.classes.id, opts.classId) : undefined,
		opts.semesterId ? eq(schema.classes.semesterId, opts.semesterId) : undefined,
		opts.query
			? or(
					ilike(schema.exams.name, `%${opts.query}%`),
					ilike(schema.classCourses.code, `%${opts.query}%`),
					ilike(schema.classes.name, `%${opts.query}%`),
					ilike(schema.courses.name, `%${opts.query}%`),
				)
			: undefined,
	].filter(Boolean) as Array<ReturnType<typeof and> | ReturnType<typeof or>>;
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select({
			exam: schema.exams,
			classCourseId: schema.classCourses.id,
			classCourseCode: schema.classCourses.code,
			classId: schema.classes.id,
			className: schema.classes.name,
			courseId: schema.courses.id,
			courseName: schema.courses.name,
		})
		.from(schema.exams)
		.innerJoin(
			schema.classCourses,
			eq(schema.classCourses.id, schema.exams.classCourse),
		)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.where(condition)
		.orderBy(asc(schema.exams.id))
		.limit(limit);
	const items = rows.map((row) => ({
		...row.exam,
		classCourse: row.exam.classCourse,
		classCourseId: row.classCourseId,
		classCourseCode: row.classCourseCode,
		classId: row.classId,
		className: row.className,
		courseId: row.courseId,
		courseName: row.courseName,
	}));
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
