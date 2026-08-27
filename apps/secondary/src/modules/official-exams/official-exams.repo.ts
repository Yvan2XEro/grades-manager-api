import { and, eq } from "drizzle-orm";
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
) {
	const conditions = [eq(officialExamSessions.institutionId, institutionId)];
	if (academicYearId) {
		conditions.push(eq(officialExamSessions.academicYearId, academicYearId));
	}
	if (examType) {
		conditions.push(eq(officialExamSessions.examType, examType));
	}

	return db
		.select()
		.from(officialExamSessions)
		.where(and(...conditions))
		.orderBy(officialExamSessions.createdAt);
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
