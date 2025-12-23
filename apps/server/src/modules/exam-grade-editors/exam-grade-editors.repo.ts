import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

const grantedByAlias = alias(schema.domainUsers, "granted_by_user");

export async function createEditor(data: schema.NewExamGradeEditor) {
	const [item] = await db
		.insert(schema.examGradeEditors)
		.values(data)
		.returning();
	return item;
}

export async function deleteEditor(id: string, examId: string) {
	const [deleted] = await db
		.delete(schema.examGradeEditors)
		.where(
			and(
				eq(schema.examGradeEditors.id, id),
				eq(schema.examGradeEditors.examId, examId),
			),
		)
		.returning();
	return deleted;
}

export async function findByExamAndEditor(examId: string, editorId: string) {
	return db.query.examGradeEditors.findFirst({
		where: and(
			eq(schema.examGradeEditors.examId, examId),
			eq(schema.examGradeEditors.editorProfileId, editorId),
		),
	});
}

export async function listByExam(examId: string) {
	return db
		.select({
			id: schema.examGradeEditors.id,
			createdAt: schema.examGradeEditors.createdAt,
			editor: {
				id: schema.domainUsers.id,
				firstName: schema.domainUsers.firstName,
				lastName: schema.domainUsers.lastName,
				primaryEmail: schema.domainUsers.primaryEmail,
			},
			grantedBy: {
				id: grantedByAlias.id,
				firstName: grantedByAlias.firstName,
				lastName: grantedByAlias.lastName,
			},
		})
		.from(schema.examGradeEditors)
		.innerJoin(
			schema.domainUsers,
			eq(schema.domainUsers.id, schema.examGradeEditors.editorProfileId),
		)
		.leftJoin(
			grantedByAlias,
			eq(grantedByAlias.id, schema.examGradeEditors.grantedByProfileId),
		)
		.where(eq(schema.examGradeEditors.examId, examId))
		.orderBy(schema.examGradeEditors.createdAt);
}

export async function examIdsForEditor(
	editorProfileId: string,
	examIds: string[],
) {
	if (examIds.length === 0) return [] as string[];
	const rows = await db
		.select({ examId: schema.examGradeEditors.examId })
		.from(schema.examGradeEditors)
		.where(
			and(
				inArray(schema.examGradeEditors.examId, examIds),
				eq(schema.examGradeEditors.editorProfileId, editorProfileId),
			),
	);
	return rows.map((row) => row.examId);
}

export async function classCourseIdsForEditor(
	editorProfileId: string,
	institutionId: string,
) {
	const rows = await db
		.selectDistinct({ classCourseId: schema.exams.classCourse })
		.from(schema.examGradeEditors)
		.innerJoin(
			schema.exams,
			eq(schema.exams.id, schema.examGradeEditors.examId),
		)
		.where(
			and(
				eq(schema.examGradeEditors.editorProfileId, editorProfileId),
				eq(schema.exams.institutionId, institutionId),
			),
		);
	return rows.map((row) => row.classCourseId);
}
