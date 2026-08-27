import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { enrollments, reportCards } from "../../db/schema";

export async function findAll(
	institutionId: string,
	academicYearId: string,
	termId?: string,
	classId?: string,
) {
	const baseQuery = db
		.select()
		.from(reportCards)
		.innerJoin(enrollments, eq(reportCards.enrollmentId, enrollments.id))
		.where(
			and(
				eq(reportCards.institutionId, institutionId),
				eq(enrollments.academicYearId, academicYearId),
				termId ? eq(reportCards.termId, termId) : undefined,
				classId ? eq(enrollments.classId, classId) : undefined,
			),
		);

	return baseQuery;
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
