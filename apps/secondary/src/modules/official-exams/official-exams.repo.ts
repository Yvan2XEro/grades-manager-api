import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
	enrollments,
	officialExamRegistrations,
	officialExamSessions,
	students,
} from "../../db/schema";

// ─── Official Exam Sessions ──────────────────────────────────────────

export async function findAllSessions(
	institutionId: string,
	academicYearId?: string,
	examType?: string,
	opts: { page?: number; pageSize?: number } = {},
) {
	const { page = 1, pageSize = 25 } = opts;
	const conditions = [eq(officialExamSessions.institutionId, institutionId)];
	if (academicYearId) {
		conditions.push(eq(officialExamSessions.academicYearId, academicYearId));
	}
	if (examType) {
		conditions.push(eq(officialExamSessions.examType, examType));
	}

	const [items, totalRows] = await Promise.all([
		db
			.select()
			.from(officialExamSessions)
			.where(and(...conditions))
			.orderBy(officialExamSessions.createdAt)
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db
			.select({ count: count() })
			.from(officialExamSessions)
			.where(and(...conditions)),
	]);
	return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function findSessionById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(officialExamSessions)
		.where(
			and(
				eq(officialExamSessions.id, id),
				eq(officialExamSessions.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insertSession(
	data: typeof officialExamSessions.$inferInsert,
) {
	const [row] = await db.insert(officialExamSessions).values(data).returning();
	return row!;
}

export async function updateSession(
	id: string,
	institutionId: string,
	data: Partial<typeof officialExamSessions.$inferInsert>,
) {
	const [row] = await db
		.update(officialExamSessions)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(officialExamSessions.id, id),
				eq(officialExamSessions.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

// ─── Official Exam Registrations ─────────────────────────────────────

export async function findAllRegistrations(
	examSessionId: string,
	institutionId: string,
	isEligible?: boolean,
	isAdmitted?: boolean,
) {
	const conditions = [
		eq(officialExamRegistrations.examSessionId, examSessionId),
		eq(officialExamRegistrations.institutionId, institutionId),
	];
	if (isEligible !== undefined) {
		conditions.push(eq(officialExamRegistrations.isEligible, isEligible));
	}
	if (isAdmitted !== undefined) {
		conditions.push(eq(officialExamRegistrations.isAdmitted, isAdmitted));
	}

	return db
		.select({
			registration: {
				id: officialExamRegistrations.id,
				enrollmentId: officialExamRegistrations.enrollmentId,
				candidateNumber: officialExamRegistrations.candidateNumber,
				isEligible: officialExamRegistrations.isEligible,
				hasPaidFee: officialExamRegistrations.hasPaidFee,
				feeAmount: officialExamRegistrations.feeAmount,
				feePaidAt: officialExamRegistrations.feePaidAt,
				feeTransactionRef: officialExamRegistrations.feeTransactionRef,
				isAdmitted: officialExamRegistrations.isAdmitted,
				mention: officialExamRegistrations.mention,
				createdAt: officialExamRegistrations.createdAt,
			},
			student: {
				id: students.id,
				firstName: students.firstName,
				lastName: students.lastName,
				mnu: students.mnu,
				registrationNumber: students.registrationNumber,
				dateOfBirth: students.dateOfBirth,
			},
		})
		.from(officialExamRegistrations)
		.innerJoin(
			enrollments,
			eq(officialExamRegistrations.enrollmentId, enrollments.id),
		)
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(and(...conditions))
		.orderBy(students.lastName, students.firstName);
}

export async function findRegistrationById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(officialExamRegistrations)
		.where(
			and(
				eq(officialExamRegistrations.id, id),
				eq(officialExamRegistrations.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findRegistrationBySessionAndEnrollment(
	examSessionId: string,
	enrollmentId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(officialExamRegistrations)
		.where(
			and(
				eq(officialExamRegistrations.examSessionId, examSessionId),
				eq(officialExamRegistrations.enrollmentId, enrollmentId),
				eq(officialExamRegistrations.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findStudentByEnrollment(
	enrollmentId: string,
	institutionId: string,
) {
	const rows = await db
		.select({
			mnu: students.mnu,
			firstName: students.firstName,
			lastName: students.lastName,
		})
		.from(enrollments)
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(
			and(
				eq(enrollments.id, enrollmentId),
				eq(enrollments.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insertRegistration(
	data: typeof officialExamRegistrations.$inferInsert,
) {
	const [row] = await db
		.insert(officialExamRegistrations)
		.values(data)
		.returning();
	return row!;
}

export async function updateRegistration(
	id: string,
	institutionId: string,
	data: Partial<typeof officialExamRegistrations.$inferInsert>,
) {
	const [row] = await db
		.update(officialExamRegistrations)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(officialExamRegistrations.id, id),
				eq(officialExamRegistrations.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

export async function findEnrollmentIdsByClass(
	classId: string,
	institutionId: string,
) {
	const rows = await db
		.select({ id: enrollments.id })
		.from(enrollments)
		.where(
			and(
				eq(enrollments.classId, classId),
				eq(enrollments.institutionId, institutionId),
				eq(enrollments.status, "active"),
			),
		);
	return rows.map((r) => r.id);
}

export async function findExistingRegistrationEnrollmentIds(
	examSessionId: string,
	enrollmentIds: string[],
) {
	if (enrollmentIds.length === 0) return new Set<string>();
	const rows = await db
		.select({ enrollmentId: officialExamRegistrations.enrollmentId })
		.from(officialExamRegistrations)
		.where(
			and(
				eq(officialExamRegistrations.examSessionId, examSessionId),
				inArray(officialExamRegistrations.enrollmentId, enrollmentIds),
			),
		);
	return new Set(rows.map((r) => r.enrollmentId));
}

export async function bulkInsertRegistrations(
	items: (typeof officialExamRegistrations.$inferInsert)[],
) {
	if (items.length === 0) return [];
	return db
		.insert(officialExamRegistrations)
		.values(items)
		.onConflictDoNothing()
		.returning();
}
