import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	lt,
	or,
	sql,
} from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import type { TransactionClient } from "../_shared/db-transaction";

export async function create(data: schema.NewExam) {
	const [item] = await db.insert(schema.exams).values(data).returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewExam>,
	institutionId: string,
	tx?: TransactionClient,
) {
	const [item] = await (tx ?? db)
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
	classCourseIds?: string[];
	classId?: string;
	semesterId?: string;
	dateFrom?: Date;
	dateTo?: Date;
	cursor?: string;
	limit?: number;
	query?: string;
	academicYearId?: string;
	ueSemester?: string;
	status?: string;
	statuses?: string[];
	teacherId?: string;
}) {
	const limit = opts.limit ?? 50;

	// Base filters (used for both items query and count query)
	const baseConditions = [
		eq(schema.exams.institutionId, opts.institutionId),
		opts.classCourseId
			? eq(schema.exams.classCourse, opts.classCourseId)
			: undefined,
		opts.classCourseIds?.length
			? inArray(schema.exams.classCourse, opts.classCourseIds)
			: undefined,
		opts.dateFrom ? gte(schema.exams.date, opts.dateFrom) : undefined,
		opts.dateTo
			? lt(schema.exams.date, new Date(opts.dateTo.getTime() + 86_400_000))
			: undefined,
		opts.academicYearId
			? eq(schema.classes.academicYear, opts.academicYearId)
			: undefined,
		opts.classId ? eq(schema.classes.id, opts.classId) : undefined,
		opts.status ? eq(schema.exams.status, opts.status) : undefined,
		opts.statuses?.length
			? inArray(schema.exams.status, opts.statuses)
			: undefined,
		opts.ueSemester
			? eq(
					schema.teachingUnits.semester,
					opts.ueSemester as schema.TeachingUnitSemester,
				)
			: undefined,
		opts.teacherId
			? eq(schema.classCourses.teacher, opts.teacherId)
			: undefined,
		opts.query
			? or(
					ilike(schema.exams.name, `%${opts.query}%`),
					ilike(schema.classCourses.code, `%${opts.query}%`),
					ilike(schema.classes.name, `%${opts.query}%`),
					ilike(schema.courses.name, `%${opts.query}%`),
				)
			: undefined,
	].filter(Boolean) as Array<ReturnType<typeof and> | ReturnType<typeof or>>;

	const toCondition = (conds: typeof baseConditions) =>
		conds.length === 0
			? undefined
			: conds.length === 1
				? conds[0]
				: and(...conds);

	// Items query includes cursor for pagination
	const itemConditions = [
		...baseConditions,
		opts.cursor ? gt(schema.exams.id, opts.cursor) : undefined,
	].filter(Boolean) as typeof baseConditions;

	const condition = toCondition(itemConditions);
	const countCondition = toCondition(baseConditions);
	const rows = await db
		.select({
			exam: schema.exams,
			classCourseId: schema.classCourses.id,
			classCourseCode: schema.classCourses.code,
			classId: schema.classes.id,
			className: schema.classes.name,
			courseId: schema.courses.id,
			courseName: schema.courses.name,
			courseCode: schema.courses.code,
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
		.innerJoin(
			schema.teachingUnits,
			eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
		)
		.where(condition)
		.orderBy(asc(schema.exams.id))
		.limit(limit);
	const weightTotals = await courseWeightTotals([
		...new Set(rows.map((row) => row.exam.classCourse)),
	]);

	const items = rows.map((row) => ({
		...row.exam,
		/** Sum of the weights of the course's regular (non-retake) exams. */
		courseWeightTotal: weightTotals.get(row.exam.classCourse) ?? 0,
		classCourse: row.exam.classCourse,
		classCourseId: row.classCourseId,
		classCourseCode: row.classCourseCode,
		classId: row.classId,
		className: row.className,
		courseId: row.courseId,
		courseName: row.courseName,
		courseCode: row.courseCode,
	}));
	const nextCursor =
		items.length === limit ? items[items.length - 1].id : undefined;

	// Total count uses baseConditions (no cursor) so the number stays stable across pages
	const [{ total }] = await db
		.select({ total: count() })
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
		.innerJoin(
			schema.teachingUnits,
			eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
		)
		.where(countCondition);

	return { items, nextCursor, total: Number(total) };
}

export async function listPaged(opts: {
	institutionId: string;
	page: number;
	pageSize: number;
	query?: string;
	classId?: string;
	academicYearId?: string;
	status?: string;
	statuses?: string[];
	teacherId?: string;
	classCourseIds?: string[];
	dateFrom?: Date;
	dateTo?: Date;
}) {
	const size = Math.min(Math.max(opts.pageSize, 1), 100);
	const offset = (Math.max(opts.page, 1) - 1) * size;

	const baseConditions = [
		eq(schema.exams.institutionId, opts.institutionId),
		opts.classId ? eq(schema.classes.id, opts.classId) : undefined,
		opts.academicYearId
			? eq(schema.classes.academicYear, opts.academicYearId)
			: undefined,
		opts.status ? eq(schema.exams.status, opts.status) : undefined,
		opts.statuses?.length
			? inArray(schema.exams.status, opts.statuses)
			: undefined,
		opts.teacherId
			? eq(schema.classCourses.teacher, opts.teacherId)
			: undefined,
		opts.classCourseIds?.length
			? inArray(schema.exams.classCourse, opts.classCourseIds)
			: undefined,
		opts.dateFrom ? gte(schema.exams.date, opts.dateFrom) : undefined,
		opts.dateTo
			? lt(schema.exams.date, new Date(opts.dateTo.getTime() + 86_400_000))
			: undefined,
		opts.query
			? or(
					ilike(schema.exams.name, `%${opts.query}%`),
					ilike(schema.classCourses.code, `%${opts.query}%`),
					ilike(schema.classes.name, `%${opts.query}%`),
					ilike(schema.courses.name, `%${opts.query}%`),
				)
			: undefined,
	].filter(Boolean) as Array<ReturnType<typeof and> | ReturnType<typeof or>>;

	const where =
		baseConditions.length === 0
			? undefined
			: baseConditions.length === 1
				? baseConditions[0]
				: and(...baseConditions);

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				exam: schema.exams,
				classCourseId: schema.classCourses.id,
				classCourseCode: schema.classCourses.code,
				classId: schema.classes.id,
				className: schema.classes.name,
				courseId: schema.courses.id,
				courseName: schema.courses.name,
				courseCode: schema.courses.code,
			})
			.from(schema.exams)
			.innerJoin(
				schema.classCourses,
				eq(schema.classCourses.id, schema.exams.classCourse),
			)
			.innerJoin(
				schema.classes,
				eq(schema.classes.id, schema.classCourses.class),
			)
			.innerJoin(
				schema.courses,
				eq(schema.courses.id, schema.classCourses.course),
			)
			.innerJoin(
				schema.teachingUnits,
				eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
			)
			.where(where)
			.orderBy(desc(schema.exams.date), asc(schema.exams.id))
			.limit(size)
			.offset(offset),
		db
			.select({ total: count() })
			.from(schema.exams)
			.innerJoin(
				schema.classCourses,
				eq(schema.classCourses.id, schema.exams.classCourse),
			)
			.innerJoin(
				schema.classes,
				eq(schema.classes.id, schema.classCourses.class),
			)
			.innerJoin(
				schema.courses,
				eq(schema.courses.id, schema.classCourses.course),
			)
			.innerJoin(
				schema.teachingUnits,
				eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
			)
			.where(where),
	]);

	const weightTotals = await courseWeightTotals([
		...new Set(rows.map((row) => row.exam.classCourse)),
	]);

	const items = rows.map((row) => ({
		...row.exam,
		/** Sum of the weights of the course's regular (non-retake) exams. */
		courseWeightTotal: weightTotals.get(row.exam.classCourse) ?? 0,
		classCourse: row.exam.classCourse,
		classCourseId: row.classCourseId,
		classCourseCode: row.classCourseCode,
		classId: row.classId,
		className: row.className,
		courseId: row.courseId,
		courseName: row.courseName,
		courseCode: row.courseCode,
	}));

	const totalCount = Number(total ?? 0);
	return { items, total: totalCount, pageCount: Math.ceil(totalCount / size) };
}

/**
 * Sum of the exam weights of each class course, regular sessions only: a
 * retake replaces its parent exam, it does not add to the course total.
 */
export async function courseWeightTotals(classCourseIds: string[]) {
	const totals = new Map<string, number>();
	if (classCourseIds.length === 0) return totals;
	const rows = await db
		.select({
			classCourse: schema.exams.classCourse,
			total: sql<string>`coalesce(sum(${schema.exams.percentage}),0)`,
		})
		.from(schema.exams)
		.where(
			and(
				inArray(schema.exams.classCourse, classCourseIds),
				eq(schema.exams.sessionType, "normal"),
			),
		)
		.groupBy(schema.exams.classCourse);
	for (const row of rows) totals.set(row.classCourse, Number(row.total));
	return totals;
}

export async function setLock(
	examId: string,
	lock: boolean,
	institutionId: string,
	options?: { promoteToApproved?: boolean },
	tx?: TransactionClient,
) {
	const updates: Partial<schema.NewExam> = { isLocked: lock };
	if (lock && options?.promoteToApproved) {
		updates.status = "approved";
	}
	const [item] = await (tx ?? db)
		.update(schema.exams)
		.set(updates)
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

// ── Audit events ──────────────────────────────────────────────────────────────

export async function insertAuditEvent(
	data: schema.NewExamAuditEvent,
	tx?: TransactionClient,
) {
	const [row] = await (tx ?? db)
		.insert(schema.examAuditEvents)
		.values(data)
		.returning();
	return row;
}

export async function getAuditEventsForExam(
	examId: string,
	institutionId: string,
) {
	return db.query.examAuditEvents.findMany({
		where: and(
			eq(schema.examAuditEvents.examId, examId),
			eq(schema.examAuditEvents.institutionId, institutionId),
		),
		orderBy: desc(schema.examAuditEvents.createdAt),
		with: {
			actor: { columns: { firstName: true, lastName: true } },
		},
	});
}
