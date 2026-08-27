import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
	classCouncils,
	councilDecisions,
	enrollments,
	students,
} from "../../db/schema";

export async function findAll(
	institutionId: string,
	classId?: string,
	termId?: string,
	status?: string,
) {
	const conditions = [eq(classCouncils.institutionId, institutionId)];
	if (classId) conditions.push(eq(classCouncils.classId, classId));
	if (termId) conditions.push(eq(classCouncils.termId, termId));
	if (status) conditions.push(eq(classCouncils.status, status));

	return db
		.select()
		.from(classCouncils)
		.where(and(...conditions))
		.orderBy(classCouncils.createdAt);
}

export async function findById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(classCouncils)
		.where(
			and(
				eq(classCouncils.id, id),
				eq(classCouncils.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findByClassAndTerm(
	classId: string,
	termId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(classCouncils)
		.where(
			and(
				eq(classCouncils.classId, classId),
				eq(classCouncils.termId, termId),
				eq(classCouncils.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insert(data: typeof classCouncils.$inferInsert) {
	const [row] = await db.insert(classCouncils).values(data).returning();
	return row!;
}

export async function update(
	id: string,
	institutionId: string,
	data: Partial<typeof classCouncils.$inferInsert>,
) {
	const [row] = await db
		.update(classCouncils)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(classCouncils.id, id),
				eq(classCouncils.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

// ─── Council Decisions ───────────────────────────────────────────────

export async function findAllDecisions(
	councilId: string,
	institutionId: string,
) {
	return db
		.select({
			decision: {
				id: councilDecisions.id,
				enrollmentId: councilDecisions.enrollmentId,
				decision: councilDecisions.decision,
				note: councilDecisions.note,
				createdAt: councilDecisions.createdAt,
			},
			student: {
				id: students.id,
				firstName: students.firstName,
				lastName: students.lastName,
				mnu: students.mnu,
			},
		})
		.from(councilDecisions)
		.innerJoin(enrollments, eq(councilDecisions.enrollmentId, enrollments.id))
		.innerJoin(students, eq(enrollments.studentId, students.id))
		.where(
			and(
				eq(councilDecisions.councilId, councilId),
				eq(councilDecisions.institutionId, institutionId),
			),
		)
		.orderBy(students.lastName, students.firstName);
}

export async function findDecisionById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(councilDecisions)
		.where(
			and(
				eq(councilDecisions.id, id),
				eq(councilDecisions.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findDecisionByCouncilAndEnrollment(
	councilId: string,
	enrollmentId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(councilDecisions)
		.where(
			and(
				eq(councilDecisions.councilId, councilId),
				eq(councilDecisions.enrollmentId, enrollmentId),
				eq(councilDecisions.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insertDecision(
	data: typeof councilDecisions.$inferInsert,
) {
	const [row] = await db.insert(councilDecisions).values(data).returning();
	return row!;
}

export async function updateDecision(
	id: string,
	institutionId: string,
	data: Partial<typeof councilDecisions.$inferInsert>,
) {
	const [row] = await db
		.update(councilDecisions)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(councilDecisions.id, id),
				eq(councilDecisions.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}
