import { and, count, eq } from "drizzle-orm";
import { db } from "../../db";
import { classes, enrollments, students } from "../../db/schema";

export async function findByYear(
	academicYearId: string | undefined,
	institutionId: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { page = 1, pageSize = 25 } = opts;
	const where = academicYearId
		? and(
				eq(classes.academicYearId, academicYearId),
				eq(classes.institutionId, institutionId),
			)
		: eq(classes.institutionId, institutionId);
	const [items, totalRows] = await Promise.all([
		db
			.select()
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
