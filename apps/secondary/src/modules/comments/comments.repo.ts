import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { studentComments } from "../../db/schema";

export async function findByClassSubjectTerm(
	institutionId: string,
	classId: string,
	subjectId: string,
	termId: string,
) {
	return db
		.select()
		.from(studentComments)
		.where(
			and(
				eq(studentComments.institutionId, institutionId),
				eq(studentComments.classId, classId),
				eq(studentComments.subjectId, subjectId),
				eq(studentComments.termId, termId),
			),
		);
}

export async function upsertComment(data: {
	institutionId: string;
	studentId: string;
	subjectId: string;
	termId: string;
	classId: string;
	comment: string;
}) {
	const rows = await db
		.insert(studentComments)
		.values(data)
		.onConflictDoUpdate({
			target: [
				studentComments.studentId,
				studentComments.subjectId,
				studentComments.termId,
				studentComments.classId,
			],
			set: {
				comment: data.comment,
				updatedAt: new Date(),
			},
		})
		.returning();
	return rows[0]!;
}

export async function deleteComment(
	studentId: string,
	subjectId: string,
	termId: string,
	classId: string,
	institutionId: string,
) {
	await db
		.delete(studentComments)
		.where(
			and(
				eq(studentComments.studentId, studentId),
				eq(studentComments.subjectId, subjectId),
				eq(studentComments.termId, termId),
				eq(studentComments.classId, classId),
				eq(studentComments.institutionId, institutionId),
			),
		);
}
