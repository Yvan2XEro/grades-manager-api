import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const ACTIVE_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"planned",
	"active",
];
const GRADE_ELIGIBLE_STATUSES: schema.StudentCourseEnrollmentStatus[] = [
	"active",
	"completed",
];

export async function create(data: schema.NewStudentCourseEnrollment) {
	const [item] = await db
		.insert(schema.studentCourseEnrollments)
		.values(data)
		.returning();
	return item;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<schema.NewStudentCourseEnrollment>,
) {
	// First verify the enrollment belongs to the institution
	const existing = await findById(id, institutionId);
	if (!existing) return null;

	const [item] = await db
		.update(schema.studentCourseEnrollments)
		.set(data)
		.where(eq(schema.studentCourseEnrollments.id, id))
		.returning();
	return item ?? null;
}

export async function findById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(schema.studentCourseEnrollments)
		.innerJoin(
			schema.students,
			eq(schema.studentCourseEnrollments.studentId, schema.students.id),
		)
		.where(
			and(
				eq(schema.studentCourseEnrollments.id, id),
				eq(schema.students.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0]?.student_course_enrollments ?? null;
}

export async function list(
	institutionId: string,
	opts: {
		studentId?: string;
		classCourseId?: string;
		courseId?: string;
		status?: schema.StudentCourseEnrollmentStatus;
		cursor?: string;
		limit?: number;
	},
) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.students.institutionId, institutionId),
		opts.studentId
			? eq(schema.studentCourseEnrollments.studentId, opts.studentId)
			: undefined,
		opts.classCourseId
			? eq(schema.studentCourseEnrollments.classCourseId, opts.classCourseId)
			: undefined,
		opts.courseId
			? eq(schema.studentCourseEnrollments.courseId, opts.courseId)
			: undefined,
		opts.status
			? eq(schema.studentCourseEnrollments.status, opts.status)
			: undefined,
		opts.cursor
			? gt(schema.studentCourseEnrollments.id, opts.cursor)
			: undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db
		.select({
			id: schema.studentCourseEnrollments.id,
			studentId: schema.studentCourseEnrollments.studentId,
			classCourseId: schema.studentCourseEnrollments.classCourseId,
			courseId: schema.studentCourseEnrollments.courseId,
			sourceClassId: schema.studentCourseEnrollments.sourceClassId,
			academicYearId: schema.studentCourseEnrollments.academicYearId,
			status: schema.studentCourseEnrollments.status,
			attempt: schema.studentCourseEnrollments.attempt,
			creditsAttempted: schema.studentCourseEnrollments.creditsAttempted,
			creditsEarned: schema.studentCourseEnrollments.creditsEarned,
			startedAt: schema.studentCourseEnrollments.startedAt,
			completedAt: schema.studentCourseEnrollments.completedAt,
		})
		.from(schema.studentCourseEnrollments)
		.innerJoin(
			schema.students,
			eq(schema.studentCourseEnrollments.studentId, schema.students.id),
		)
		.where(condition)
		.orderBy(schema.studentCourseEnrollments.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	let items = rows;
	if (rows.length > limit) {
		items = rows.slice(0, limit);
		nextCursor = items[items.length - 1]?.id;
	}
	return { items, nextCursor };
}

export async function closeForStudent(
	studentId: string,
	status: schema.StudentCourseEnrollmentStatus,
) {
	const updates = await db
		.update(schema.studentCourseEnrollments)
		.set({
			status,
			completedAt: new Date(),
		})
		.where(
			and(
				eq(schema.studentCourseEnrollments.studentId, studentId),
				inArray(schema.studentCourseEnrollments.status, ACTIVE_STATUSES),
			),
		)
		.returning();
	return updates;
}

export async function findEligibleForClassCourse(
	classCourseId: string,
	studentId: string,
) {
	return db.query.studentCourseEnrollments.findFirst({
		where: and(
			eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
			eq(schema.studentCourseEnrollments.studentId, studentId),
			inArray(schema.studentCourseEnrollments.status, GRADE_ELIGIBLE_STATUSES),
		),
	});
}

export async function countRosterForClassCourse(classCourseId: string) {
	const [result] = await db
		.select({
			total: sql<number>`count(*)`,
		})
		.from(schema.studentCourseEnrollments)
		.where(
			and(
				eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
				inArray(schema.studentCourseEnrollments.status, ACTIVE_STATUSES),
			),
		);
	return Number(result?.total ?? 0);
}

export async function upsertMany(data: schema.NewStudentCourseEnrollment[]) {
	if (!data.length) return [];
	const items = await db
		.insert(schema.studentCourseEnrollments)
		.values(data)
		.returning();
	return items;
}

export async function findByStudentAndStatuses(
	studentId: string,
	statuses: schema.StudentCourseEnrollmentStatus[],
) {
	return db.query.studentCourseEnrollments.findMany({
		where: and(
			eq(schema.studentCourseEnrollments.studentId, studentId),
			inArray(schema.studentCourseEnrollments.status, statuses),
		),
	});
}
