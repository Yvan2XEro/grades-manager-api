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
	const conditions = [
		opts.studentId
			? eq(schema.enrollments.studentId, opts.studentId)
			: undefined,
		opts.classId ? eq(schema.enrollments.classId, opts.classId) : undefined,
		opts.academicYearId
			? eq(schema.enrollments.academicYearId, opts.academicYearId)
			: undefined,
		opts.status ? eq(schema.enrollments.status, opts.status) : undefined,
		opts.cursor ? gt(schema.enrollments.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
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
