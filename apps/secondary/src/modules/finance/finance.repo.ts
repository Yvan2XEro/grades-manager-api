import { and, eq, sum } from "drizzle-orm";
import { db } from "../../db";
import { feeSchedules, payments } from "../../db/schema";

export async function findAllSchedules(
	institutionId: string,
	opts: {
		academicYearId?: string;
		classId?: string;
		limit?: number;
		offset?: number;
	},
) {
	const { academicYearId, classId, limit = 50, offset = 0 } = opts;
	const conditions = [eq(feeSchedules.institutionId, institutionId)];

	if (academicYearId) {
		conditions.push(eq(feeSchedules.academicYearId, academicYearId));
	}
	if (classId) {
		conditions.push(eq(feeSchedules.classId, classId));
	}

	return db
		.select()
		.from(feeSchedules)
		.where(and(...conditions))
		.orderBy(feeSchedules.createdAt)
		.limit(limit)
		.offset(offset);
}

export async function findScheduleById(id: string, institutionId: string) {
	const rows = await db
		.select()
		.from(feeSchedules)
		.where(
			and(
				eq(feeSchedules.id, id),
				eq(feeSchedules.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function insertSchedule(data: typeof feeSchedules.$inferInsert) {
	const [row] = await db.insert(feeSchedules).values(data).returning();
	return row!;
}

export async function findAllPayments(
	institutionId: string,
	opts: {
		enrollmentId?: string;
		feeType?: string;
		limit?: number;
		offset?: number;
	},
) {
	const { enrollmentId, feeType, limit = 50, offset = 0 } = opts;
	const conditions = [eq(payments.institutionId, institutionId)];

	if (enrollmentId) {
		conditions.push(eq(payments.enrollmentId, enrollmentId));
	}
	if (feeType) {
		conditions.push(eq(payments.feeType, feeType));
	}

	return db
		.select()
		.from(payments)
		.where(and(...conditions))
		.orderBy(payments.paidAt)
		.limit(limit)
		.offset(offset);
}

export async function insertPayment(data: typeof payments.$inferInsert) {
	const [row] = await db.insert(payments).values(data).returning();
	return row!;
}

export async function sumPaymentsByEnrollment(
	institutionId: string,
	enrollmentId: string,
) {
	const result = await db
		.select({ total: sum(payments.amount) })
		.from(payments)
		.where(
			and(
				eq(payments.institutionId, institutionId),
				eq(payments.enrollmentId, enrollmentId),
			),
		);
	return Number(result[0]?.total ?? 0);
}
