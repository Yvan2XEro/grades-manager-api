import { and, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export async function create(data: schema.NewClassCourse) {
	const [item] = await db.insert(schema.classCourses).values(data).returning();
	return item;
}

export async function update(
	id: string,
	data: Partial<schema.NewClassCourse>,
	institutionId: string,
) {
	const [item] = await db
		.update(schema.classCourses)
		.set(data)
		.where(
			and(
				eq(schema.classCourses.id, id),
				eq(schema.classCourses.institutionId, institutionId),
			),
		)
		.returning();
	return item;
}

export async function remove(id: string, institutionId: string) {
	await db
		.delete(schema.classCourses)
		.where(
			and(
				eq(schema.classCourses.id, id),
				eq(schema.classCourses.institutionId, institutionId),
			),
		);
}

export async function findById(id: string, institutionId?: string) {
	return db.query.classCourses.findFirst({
		where: institutionId
			? and(
					eq(schema.classCourses.id, id),
					eq(schema.classCourses.institutionId, institutionId),
				)
			: eq(schema.classCourses.id, id),
	});
}

export async function list(opts: {
	institutionId: string;
	classId?: string;
	courseId?: string;
	teacherId?: string;
	cursor?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 50;
	const conditions = [
		eq(schema.classCourses.institutionId, opts.institutionId),
		opts.classId ? eq(schema.classCourses.class, opts.classId) : undefined,
		opts.courseId ? eq(schema.classCourses.course, opts.courseId) : undefined,
		opts.teacherId
			? eq(schema.classCourses.teacher, opts.teacherId)
			: undefined,
		opts.cursor ? gt(schema.classCourses.id, opts.cursor) : undefined,
	].filter(Boolean) as (ReturnType<typeof eq> | ReturnType<typeof gt>)[];
	const condition =
		conditions.length === 0
			? undefined
			: conditions.length === 1
				? conditions[0]
				: and(...conditions);
	const rows = await db.query.classCourses.findMany({
		where: condition,
		orderBy: (classCourses, { asc }) => asc(classCourses.id),
		limit: limit + 1,
		with: {
			courseRef: {
				columns: {
					name: true,
					code: true,
				},
			},
			teacherRef: {
				columns: {
					firstName: true,
					lastName: true,
					primaryEmail: true,
				},
			},
		},
	});

	let nextCursor: string | undefined;
	if (rows.length > limit) {
		const next = rows.pop();
		nextCursor = next?.id;
	}

	const items = rows.map((row) => ({
		id: row.id,
		code: row.code,
		class: row.class,
		course: row.course,
		teacher: row.teacher,
		weeklyHours: row.weeklyHours,
		createdAt: row.createdAt,
		semesterId: row.semesterId,
		courseName: row.courseRef?.name,
		courseCode: row.courseRef?.code,
		teacherFirstName: row.teacherRef?.firstName,
		teacherLastName: row.teacherRef?.lastName,
	}));

	return { items, nextCursor };
}

export async function findByCode(
	code: string,
	academicYearId: string,
	institutionId: string,
) {
	const [match] = await db
		.select({ id: schema.classCourses.id })
		.from(schema.classCourses)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
		.where(
			and(
				eq(schema.classCourses.code, code),
				eq(schema.classes.academicYear, academicYearId),
				eq(schema.classCourses.institutionId, institutionId),
			),
		)
		.limit(1);
	if (!match) return null;
	return findById(match.id, institutionId);
}

export async function search(opts: {
	institutionId: string;
	query: string;
	classId?: string;
	limit?: number;
}) {
	const limit = opts.limit ?? 20;
	const searchCondition = or(
		ilike(schema.classCourses.code, `%${opts.query}%`),
		ilike(schema.courses.code, `%${opts.query}%`),
		ilike(schema.courses.name, `%${opts.query}%`),
	);
	const scopedSearch = and(
		eq(schema.classCourses.institutionId, opts.institutionId),
		searchCondition,
	);
	const condition = opts.classId
		? and(eq(schema.classCourses.class, opts.classId), scopedSearch)
		: scopedSearch;

	const items = await db.query.classCourses.findMany({
		where: condition,
		orderBy: (classCourses, { asc }) => asc(classCourses.code),
		limit,
		with: {
			courseRef: {
				columns: {
					name: true,
					code: true,
				},
			},
			teacherRef: {
				columns: {
					firstName: true,
					lastName: true,
					primaryEmail: true,
				},
			},
		},
	});

	return items.map((row) => ({
		id: row.id,
		code: row.code,
		class: row.class,
		course: row.course,
		teacher: row.teacher,
		weeklyHours: row.weeklyHours,
		createdAt: row.createdAt,
		semesterId: row.semesterId,
		courseName: row.courseRef?.name,
		courseCode: row.courseRef?.code,
		teacherFirstName: row.teacherRef?.firstName,
		teacherLastName: row.teacherRef?.lastName,
	}));
}
