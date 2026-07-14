import { and, count, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function create(data: schema.NewEnrollment) {
	const [enrollment] = await db
		.insert(schema.enrollments)
		.values(data)
		.returning();
	return enrollment;
}

export async function update(
	id: string,
	data: Partial<schema.NewEnrollment>,
	institutionId: string,
) {
	const [enrollment] = await db
		.update(schema.enrollments)
		.set(data)
		.where(
			and(
				eq(schema.enrollments.id, id),
				eq(schema.enrollments.institutionId, institutionId),
			),
		)
		.returning();
	return enrollment;
}

export async function findById(id: string, institutionId: string) {
	return db.query.enrollments.findFirst({
		where: and(
			eq(schema.enrollments.id, id),
			eq(schema.enrollments.institutionId, institutionId),
		),
	});
}

export async function findActive(studentId: string, institutionId?: string) {
	const conditions = [
		eq(schema.enrollments.studentId, studentId),
		eq(schema.enrollments.status, "active"),
	] as ReturnType<typeof eq>[];
	if (institutionId) {
		conditions.push(eq(schema.enrollments.institutionId, institutionId));
	}
	const where = conditions.length === 1 ? conditions[0] : and(...conditions);
	return db.query.enrollments.findFirst({
		where,
	});
}

export async function list(opts: {
	institutionId: string;
	studentId?: string;
	classId?: string;
	academicYearId?: string;
	status?: schema.EnrollmentStatus;
	cursor?: string;
	limit?: number;
}) {
	const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
	const conditions = [
		eq(schema.enrollments.institutionId, opts.institutionId),
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

export async function listPaged(opts: {
	institutionId: string;
	page: number;
	pageSize: number;
	classId?: string;
	academicYearId?: string;
	status?: schema.EnrollmentStatus;
	programId?: string;
	cycleId?: string;
	studentIds?: string[];
}) {
	const size = Math.min(Math.max(opts.pageSize, 1), 100);
	const offset = (Math.max(opts.page, 1) - 1) * size;

	// Resolve programId / cycleId into a concrete set of class IDs so the
	// count query reflects the filtered set (not a post-filter on results).
	let filteredClassIds: string[] | undefined;
	if (opts.programId || opts.cycleId) {
		const classConditions = [
			eq(schema.classes.institutionId, opts.institutionId),
			opts.programId ? eq(schema.classes.program, opts.programId) : undefined,
		].filter(Boolean) as ReturnType<typeof eq>[];

		let classRows: { id: string }[];
		if (opts.cycleId) {
			classRows = await db
				.select({ id: schema.classes.id })
				.from(schema.classes)
				.innerJoin(
					schema.programs,
					eq(schema.programs.id, schema.classes.program),
				)
				.where(
					and(...classConditions, eq(schema.programs.cycleId, opts.cycleId)),
				);
		} else {
			classRows = await db
				.select({ id: schema.classes.id })
				.from(schema.classes)
				.where(
					classConditions.length === 1
						? classConditions[0]
						: and(...classConditions),
				);
		}
		filteredClassIds = classRows.map((r) => r.id);

		if (filteredClassIds.length === 0) {
			return { items: [], total: 0, pageCount: 0 };
		}
	}

	const conditions = [
		eq(schema.enrollments.institutionId, opts.institutionId),
		opts.classId ? eq(schema.enrollments.classId, opts.classId) : undefined,
		opts.academicYearId
			? eq(schema.enrollments.academicYearId, opts.academicYearId)
			: undefined,
		opts.status ? eq(schema.enrollments.status, opts.status) : undefined,
		filteredClassIds
			? inArray(schema.enrollments.classId, filteredClassIds)
			: undefined,
		opts.studentIds
			? inArray(schema.enrollments.studentId, opts.studentIds)
			: undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof inArray>)[];
	const where = conditions.length > 1 ? and(...conditions) : conditions[0];

	const [rows, [{ total }]] = await Promise.all([
		db
			.select()
			.from(schema.enrollments)
			.where(where)
			.orderBy(schema.enrollments.enrolledAt, schema.enrollments.id)
			.limit(size)
			.offset(offset),
		db.select({ total: count() }).from(schema.enrollments).where(where),
	]);
	const totalCount = Number(total ?? 0);
	return {
		items: rows,
		total: totalCount,
		pageCount: Math.ceil(totalCount / size),
	};
}

export async function deleteById(id: string, institutionId: string) {
	const [deleted] = await db
		.delete(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.id, id),
				eq(schema.enrollments.institutionId, institutionId),
			),
		)
		.returning();
	return deleted ?? null;
}

export async function closeActive(
	studentId: string,
	status: schema.EnrollmentStatus = "completed",
	institutionId?: string,
	txDb?: any,
) {
	const conditions = [
		eq(schema.enrollments.studentId, studentId),
		eq(schema.enrollments.status, "active"),
	] as ReturnType<typeof eq>[];
	if (institutionId) {
		conditions.push(eq(schema.enrollments.institutionId, institutionId));
	}
	const where = conditions.length === 1 ? conditions[0] : and(...conditions);
	const [record] = await (txDb ?? db)
		.update(schema.enrollments)
		.set({
			status,
			exitedAt: new Date(),
		})
		.where(where)
		.returning();
	return record ?? null;
}
