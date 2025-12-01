import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export async function findByStudentAndYear(
	studentId: string,
	academicYearId: string,
) {
	return db.query.studentCreditLedgers.findFirst({
		where: and(
			eq(schema.studentCreditLedgers.studentId, studentId),
			eq(schema.studentCreditLedgers.academicYearId, academicYearId),
		),
	});
}

export async function create(data: schema.NewStudentCreditLedger) {
	const [ledger] = await db
		.insert(schema.studentCreditLedgers)
		.values(data)
		.returning();
	return ledger;
}

export async function applyDelta(
	id: string,
	deltaProgress: number,
	deltaEarned: number,
) {
	const [updated] = await db
		.update(schema.studentCreditLedgers)
		.set({
			creditsInProgress: sql`
				${schema.studentCreditLedgers.creditsInProgress} + ${deltaProgress}
			`,
			creditsEarned: sql`
				${schema.studentCreditLedgers.creditsEarned} + ${deltaEarned}
			`,
			updatedAt: new Date(),
		})
		.where(eq(schema.studentCreditLedgers.id, id))
		.returning();
	return updated;
}

export async function listByStudent(studentId: string) {
	return db.query.studentCreditLedgers.findMany({
		where: eq(schema.studentCreditLedgers.studentId, studentId),
		orderBy: (ledgers, { desc }) => desc(ledgers.updatedAt),
	});
}

export async function upsert(
	studentId: string,
	academicYearId: string,
	requiredCredits: number,
) {
	const existing = await findByStudentAndYear(studentId, academicYearId);
	if (existing) return existing;
	return create({
		studentId,
		academicYearId,
		requiredCredits,
	});
}
