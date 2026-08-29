import { and, count, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../db";
import { classes, enrollments, students } from "../../db/schema";

export async function findByYear(
	academicYearId: string | undefined,
	institutionId: string,
	opts: {
		search?: string;
		level?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	const { search, level, page = 1, pageSize = 25 } = opts;
	const conditions = [eq(classes.institutionId, institutionId)];
	if (academicYearId)
		conditions.push(eq(classes.academicYearId, academicYearId));
	if (level) conditions.push(eq(classes.level, level));
	if (search) conditions.push(ilike(classes.name, `%${search}%`));
	const where = and(...conditions);

	const [items, totalRows] = await Promise.all([
		db
			.select({
				id: classes.id,
				name: classes.name,
				code: classes.code,
				level: classes.level,
				academicYearId: classes.academicYearId,
				trackId: classes.trackId,
				classMasterId: classes.classMasterId,
				room: classes.room,
				maxCapacity: classes.maxCapacity,
				institutionId: classes.institutionId,
				createdAt: classes.createdAt,
				updatedAt: classes.updatedAt,
				studentCount: sql<number>`(
					select count(*) from ${enrollments}
					where ${enrollments.classId} = ${classes.id}
					and ${enrollments.status} = 'active'
				)`.mapWith(Number),
			})
			.from(classes)
			.where(where)
			.orderBy(classes.name)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db.select({ count: count() }).from(classes).where(where),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(classes)
		.where(and(eq(classes.id, id), eq(classes.institutionId, institutionId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function findByCode(
	code: string,
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(classes)
		.where(
			and(
				eq(classes.code, code),
				eq(classes.academicYearId, academicYearId),
				eq(classes.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof classes.$inferInsert) {
	const [row] = await db.insert(classes).values(data).returning();
	return row!;
}

export async function getRoster(classId: string, institutionId: string) {
	return db
		.select({
			enrollment: {
				id: enrollments.id,
				studentId: enrollments.studentId,
				admissionType: enrollments.admissionType,
				status: enrollments.status,
				createdAt: enrollments.createdAt,
			},
			student: {
				id: students.id,
				firstName: students.firstName,
				lastName: students.lastName,
				gender: students.gender,
				mnu: students.mnu,
				registrationNumber: students.registrationNumber,
				dateOfBirth: students.dateOfBirth,
			},
		})
		.from(enrollments)
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(
			and(
				eq(enrollments.classId, classId),
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.status, "active"),
			),
		)
		.orderBy(students.lastName, students.firstName);
}
