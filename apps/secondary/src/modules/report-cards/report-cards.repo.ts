import { and, count, eq } from "drizzle-orm";
import { db } from "../../db";
import { enrollments, reportCards, students } from "../../db/schema";

export async function findAll(
	institutionId: string,
	academicYearId: string,
	termId?: string,
	classId?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { page = 1, pageSize = 25 } = opts;
	const where = and(
		eq(reportCards.institutionId, institutionId),
		eq(enrollments.academicYearId, academicYearId),
		termId ? eq(reportCards.termId, termId) : undefined,
		classId ? eq(enrollments.classId, classId) : undefined,
	);
	const [rows, totalRows] = await Promise.all([
		db
			.select()
			.from(reportCards)
			.innerJoin(enrollments, eq(reportCards.enrollmentId, enrollments.id))
			.where(where)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db
			.select({ count: count() })
			.from(reportCards)
			.innerJoin(enrollments, eq(reportCards.enrollmentId, enrollments.id))
			.where(where),
	]);
	return { rows, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findById(id: string, institutionId: string) {
	const result = await db
		.select()
		.from(reportCards)
		.where(
			and(eq(reportCards.id, id), eq(reportCards.institutionId, institutionId)),
		)
		.limit(1);
	return result[0] ?? null;
}

export async function findByEnrollmentAndTerm(
	enrollmentId: string,
	termId: string,
	institutionId: string,
) {
	const result = await db
		.select()
		.from(reportCards)
		.where(
			and(
				eq(reportCards.enrollmentId, enrollmentId),
				eq(reportCards.termId, termId),
				eq(reportCards.institutionId, institutionId),
			),
		)
		.limit(1);
	return result[0] ?? null;
}

export async function updateStatus(
	id: string,
	status: string,
	institutionId: string,
) {
	const [updated] = await db
		.update(reportCards)
		.set({ status, updatedAt: new Date() })
		.where(
			and(eq(reportCards.id, id), eq(reportCards.institutionId, institutionId)),
		)
		.returning();
	return updated ?? null;
}

export async function findByClassAndTerm(
	classId: string,
	termId: string,
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select({
			reportCard: reportCards,
			student: {
				id: students.id,
				firstName: students.firstName,
				lastName: students.lastName,
				gender: students.gender,
				mnu: students.mnu,
				dateOfBirth: students.dateOfBirth,
			},
			enrollment: {
				id: enrollments.id,
				studentId: enrollments.studentId,
			},
		})
		.from(reportCards)
		.innerJoin(enrollments, eq(reportCards.enrollmentId, enrollments.id))
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(
			and(
				eq(reportCards.institutionId, institutionId),
				eq(reportCards.termId, termId),
				eq(enrollments.classId, classId),
				eq(enrollments.academicYearId, academicYearId),
			),
		)
		.orderBy(students.lastName, students.firstName);
	return rows;
}

export async function findEnrollmentsByClass(
	classId: string,
	academicYearId: string,
	institutionId: string,
) {
	const rows = await db
		.select({
			enrollment: {
				id: enrollments.id,
				studentId: enrollments.studentId,
			},
			student: {
				id: students.id,
				firstName: students.firstName,
				lastName: students.lastName,
			},
		})
		.from(enrollments)
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(
			and(
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.classId, classId),
				eq(enrollments.academicYearId, academicYearId),
			),
		)
		.orderBy(students.lastName, students.firstName);
	return rows;
}

export async function upsert(data: {
	institutionId: string;
	enrollmentId: string;
	termId: string;
	status?: string;
	snapshotData?: Record<string, unknown> | null;
	language?: string;
}) {
	const existing = await findByEnrollmentAndTerm(
		data.enrollmentId,
		data.termId,
		data.institutionId,
	);

	if (existing) {
		const [updated] = await db
			.update(reportCards)
			.set({
				status: data.status || existing.status,
				snapshotData: data.snapshotData ?? existing.snapshotData,
				language: data.language || existing.language,
				updatedAt: new Date(),
			})
			.where(eq(reportCards.id, existing.id))
			.returning();
		return updated!;
	}

	const [inserted] = await db
		.insert(reportCards)
		.values({
			institutionId: data.institutionId,
			enrollmentId: data.enrollmentId,
			termId: data.termId,
			status: data.status || "draft",
			snapshotData: data.snapshotData,
			language: data.language || "fr",
		})
		.returning();
	return inserted!;
}
