import { and, asc, eq, gt, ilike, inArray, or } from "drizzle-orm";
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
	classCourseIds?: string[];
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
		opts.classCourseIds && opts.classCourseIds.length > 0
			? inArray(schema.classCourses.id, opts.classCourseIds)
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
	classCourseIds?: string[];
	limit?: number;
}) {
	const limit = opts.limit ?? 20;
	const searchTerm = `%${opts.query}%`;
	const filters = [
		eq(schema.classCourses.institutionId, opts.institutionId),
		or(
			ilike(schema.classCourses.code, searchTerm),
			ilike(schema.courses.code, searchTerm),
			ilike(schema.courses.name, searchTerm),
			ilike(schema.classes.name, searchTerm),
		),
		opts.classId ? eq(schema.classCourses.class, opts.classId) : undefined,
		opts.classCourseIds && opts.classCourseIds.length > 0
			? inArray(schema.classCourses.id, opts.classCourseIds)
			: undefined,
	].filter(Boolean) as Array<ReturnType<typeof and> | ReturnType<typeof or>>;
	const condition =
		filters.length === 0
			? undefined
			: filters.length === 1
				? filters[0]
				: and(...filters);
	const rows = await db
		.select({
			classCourse: schema.classCourses,
			className: schema.classes.name,
			courseName: schema.courses.name,
			courseCode: schema.courses.code,
			teacherFirstName: schema.domainUsers.firstName,
			teacherLastName: schema.domainUsers.lastName,
			teacherEmail: schema.domainUsers.primaryEmail,
		})
		.from(schema.classCourses)
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
		.leftJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.classCourses.teacher),
		)
		.where(condition)
		.orderBy(asc(schema.classCourses.code))
		.limit(limit);

	return rows.map((row) => ({
		id: row.classCourse.id,
		code: row.classCourse.code,
		class: row.classCourse.class,
		className: row.className ?? null,
		course: row.classCourse.course,
		teacher: row.classCourse.teacher,
		weeklyHours: row.classCourse.weeklyHours,
		createdAt: row.classCourse.createdAt,
		semesterId: row.classCourse.semesterId,
		courseName: row.courseName ?? null,
		courseCode: row.courseCode ?? null,
		teacherFirstName: row.teacherFirstName ?? null,
		teacherLastName: row.teacherLastName ?? null,
		teacherPrimaryEmail: row.teacherEmail ?? null,
	}));
}
