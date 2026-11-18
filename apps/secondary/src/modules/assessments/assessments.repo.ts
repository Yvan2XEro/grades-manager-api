import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { assessments, staff, subjectAssignments } from "../../db/schema";

export async function findStaffByAuthUser(
	authUserId: string,
	institutionId: string,
) {
	const rows = await db
		.select({ id: staff.id })
		.from(staff)
		.where(
			and(
				eq(staff.authUserId, authUserId),
				eq(staff.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findAssignment(
	staffId: string,
	classId: string,
	subjectId: string,
	institutionId: string,
) {
	const rows = await db
		.select({ id: subjectAssignments.id })
		.from(subjectAssignments)
		.where(
			and(
				eq(subjectAssignments.staffId, staffId),
				eq(subjectAssignments.classId, classId),
				eq(subjectAssignments.subjectId, subjectId),
				eq(subjectAssignments.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findByClassSubjectTerm(
	institutionId: string,
	classId: string,
	subjectId: string,
	termId: string,
) {
	return db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.classId, classId),
				eq(assessments.subjectId, subjectId),
				eq(assessments.termId, termId),
			),
		);
}

export async function findByStudentTerm(
	institutionId: string,
	studentId: string,
	termId: string,
) {
	return db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.studentId, studentId),
				eq(assessments.termId, termId),
			),
		);
}

export async function findByClassTerm(
	institutionId: string,
	classId: string,
	termId: string,
) {
	return db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.classId, classId),
				eq(assessments.termId, termId),
			),
		);
}

export async function findAllForClass(institutionId: string, classId: string) {
	return db
		.select({
			termId: assessments.termId,
			subjectId: assessments.subjectId,
			studentId: assessments.studentId,
			value: assessments.value,
		})
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, institutionId),
				eq(assessments.classId, classId),
			),
		);
}

export async function upsertOne(data: {
	institutionId: string;
	studentId: string;
	classId: string;
	subjectId: string;
	termId: string;
	assessmentType: string;
	value: number | null;
	enteredById?: string | null;
}) {
	const existing = await db
		.select()
		.from(assessments)
		.where(
			and(
				eq(assessments.institutionId, data.institutionId),
				eq(assessments.studentId, data.studentId),
				eq(assessments.subjectId, data.subjectId),
				eq(assessments.termId, data.termId),
				eq(assessments.assessmentType, data.assessmentType),
			),
		)
		.limit(1);

	if (existing[0]) {
		const [updated] = await db
			.update(assessments)
			.set({
				value: data.value != null ? data.value.toString() : null,
				enteredById: data.enteredById,
				updatedAt: new Date(),
			})
			.where(eq(assessments.id, existing[0].id))
			.returning();
		return updated!;
	}

	const [inserted] = await db
		.insert(assessments)
		.values({
			institutionId: data.institutionId,
			studentId: data.studentId,
			classId: data.classId,
			subjectId: data.subjectId,
			termId: data.termId,
			assessmentType: data.assessmentType,
			value: data.value != null ? data.value.toString() : null,
			enteredById: data.enteredById,
		})
		.returning();
	return inserted!;
}
