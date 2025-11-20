import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function create(data: schema.NewEnrollment) {
	const [enrollment] = await db
		.insert(schema.enrollments)
		.values(data)
		.returning();
	return enrollment;
}

export async function update(id: string, data: Partial<schema.NewEnrollment>) {
	const [enrollment] = await db
		.update(schema.enrollments)
		.set(data)
		.where(eq(schema.enrollments.id, id))
		.returning();
	return enrollment;
}

export async function findById(id: string) {
	return db.query.enrollments.findFirst({
		where: eq(schema.enrollments.id, id),
	});
}

export async function findActive(studentId: string) {
	return db.query.enrollments.findFirst({
		where: and(
			eq(schema.enrollments.studentId, studentId),
			eq(schema.enrollments.status, "active"),
		),
	});
}

export async function list(opts: {
	studentId?: string;
	classId?: string;
	academicYearId?: string;
	status?: schema.EnrollmentStatus;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	let condition;
	if (opts.studentId) {
		condition = eq(schema.enrollments.studentId, opts.studentId);
	}
	if (opts.classId) {
		const classCond = eq(schema.enrollments.classId, opts.classId);
		condition = condition ? and(condition, classCond) : classCond;
	}
	if (opts.academicYearId) {
		const yearCond = eq(schema.enrollments.academicYearId, opts.academicYearId);
		condition = condition ? and(condition, yearCond) : yearCond;
	}
	if (opts.status) {
		const statusCond = eq(schema.enrollments.status, opts.status);
		condition = condition ? and(condition, statusCond) : statusCond;
	}
	if (opts.cursor) {
		const cursorCond = gt(schema.enrollments.id, opts.cursor);
		condition = condition ? and(condition, cursorCond) : cursorCond;
	}
	const items = await db
		.select()
		.from(schema.enrollments)
		.where(condition)
		.orderBy(schema.enrollments.id)
		.limit(limit + 1);
	let nextCursor: string | undefined;
	if (items.length > limit) {
		const next = items.pop();
		nextCursor = next?.id;
	}
	return { items, nextCursor };
}

export async function closeActive(
	studentId: string,
	status: schema.EnrollmentStatus = "completed",
) {
	const [record] = await db
		.update(schema.enrollments)
		.set({
			status,
			exitedAt: new Date(),
		})
		.where(
			and(
				eq(schema.enrollments.studentId, studentId),
				eq(schema.enrollments.status, "active"),
			),
		)
		.returning();
	return record ?? null;
}
