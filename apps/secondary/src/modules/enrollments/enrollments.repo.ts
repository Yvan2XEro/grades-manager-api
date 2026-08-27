import { and, count, eq } from "drizzle-orm";
import { db } from "../../db";
import { enrollments, students } from "../../db/schema";

export async function findAll(
	institutionId: string,
	academicYearId: string,
	classId?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { page = 1, pageSize = 25 } = opts;
	const conditions = [
		eq(enrollments.institutionId, institutionId),
		eq(enrollments.academicYearId, academicYearId),
	];
	if (classId) conditions.push(eq(enrollments.classId, classId));
	const [items, totalRows] = await Promise.all([
		db
			.select({
				enrollment: {
					id: enrollments.id,
					studentId: enrollments.studentId,
					classId: enrollments.classId,
					academicYearId: enrollments.academicYearId,
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
				},
			})
			.from(enrollments)
			.innerJoin(students, eq(enrollments.studentId, students.id))
			.where(and(...conditions))
			.orderBy(students.lastName, students.firstName)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db
			.select({ count: count() })
			.from(enrollments)
			.where(and(...conditions)),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(enrollments)
		.where(
			and(eq(enrollments.id, id), eq(enrollments.institutionId, institutionId)),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findByStudentAndYear(
	studentId: string,
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(enrollments)
		.where(
			and(
				eq(enrollments.studentId, studentId),
				eq(enrollments.academicYearId, academicYearId),
				eq(enrollments.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof enrollments.$inferInsert) {
	const [row] = await db.insert(enrollments).values(data).returning();
	return row!;
}

export async function updateStatus(
	id: string,
	institutionId: string,
	status: string,
) {
	const [row] = await db
		.update(enrollments)
		.set({ status, updatedAt: new Date() })
		.where(
			and(eq(enrollments.id, id), eq(enrollments.institutionId, institutionId)),
		)
		.returning();
	return row ?? null;
}

export async function countActive(
	institutionId: string,
	academicYearId?: string,
) {
	const conditions = [
		eq(enrollments.institutionId, institutionId),
		eq(enrollments.status, "active"),
	];
	if (academicYearId)
		conditions.push(eq(enrollments.academicYearId, academicYearId));
	const rows = await db
		.select({ id: enrollments.id })
		.from(enrollments)
		.where(and(...conditions));
	return rows.length;
}
