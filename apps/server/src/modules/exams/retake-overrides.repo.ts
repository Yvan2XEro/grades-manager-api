import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";

export type RetakeOverride = typeof schema.retakeOverrides.$inferSelect;

export type UpsertRetakeOverrideInput = {
	examId: string;
	studentCourseEnrollmentId: string;
	institutionId: string;
	decision: schema.RetakeOverrideDecision;
	reason: string;
	createdBy?: string | null;
};

export async function upsert(
	input: UpsertRetakeOverrideInput,
): Promise<RetakeOverride> {
	const [record] = await db
		.insert(schema.retakeOverrides)
		.values({
			examId: input.examId,
			studentCourseEnrollmentId: input.studentCourseEnrollmentId,
			institutionId: input.institutionId,
			decision: input.decision,
			reason: input.reason,
			createdBy: input.createdBy ?? null,
		})
		.onConflictDoUpdate({
			target: [
				schema.retakeOverrides.examId,
				schema.retakeOverrides.studentCourseEnrollmentId,
			],
			set: {
				decision: input.decision,
				reason: input.reason,
				createdBy: input.createdBy ?? null,
				institutionId: input.institutionId,
				createdAt: new Date(),
			},
		})
		.returning();
	return record;
}

export async function deleteByExamAndEnrollment(
	examId: string,
	studentCourseEnrollmentId: string,
	institutionId: string,
) {
	await db
		.delete(schema.retakeOverrides)
		.where(
			and(
				eq(schema.retakeOverrides.examId, examId),
				eq(
					schema.retakeOverrides.studentCourseEnrollmentId,
					studentCourseEnrollmentId,
				),
				eq(schema.retakeOverrides.institutionId, institutionId),
			),
		);
}

export async function listByExam(
	examId: string,
	institutionId: string,
): Promise<RetakeOverride[]> {
	return db
		.select()
		.from(schema.retakeOverrides)
		.where(
			and(
				eq(schema.retakeOverrides.examId, examId),
				eq(schema.retakeOverrides.institutionId, institutionId),
			),
		);
}

export async function findByExamAndEnrollment(
	examId: string,
	studentCourseEnrollmentId: string,
	institutionId: string,
) {
	return db.query.retakeOverrides.findFirst({
		where: and(
			eq(schema.retakeOverrides.examId, examId),
			eq(
				schema.retakeOverrides.studentCourseEnrollmentId,
				studentCourseEnrollmentId,
			),
			eq(schema.retakeOverrides.institutionId, institutionId),
		),
	});
}
