import { and, between, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { attendanceRecords, attendanceSessions } from "../../db/schema";

// ─── Session queries ─────────────────────────────────────────────────────────

export async function findSessionById(
	sessionId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(attendanceSessions)
		.where(
			and(
				eq(attendanceSessions.id, sessionId),
				eq(attendanceSessions.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findSessionsByClass(
	institutionId: string,
	classId: string,
	filters?: {
		termId?: string;
		startDate?: Date;
		endDate?: Date;
	},
) {
	const conditions = [
		eq(attendanceSessions.institutionId, institutionId),
		eq(attendanceSessions.classId, classId),
	];

	if (filters?.termId) {
		conditions.push(eq(attendanceSessions.termId, filters.termId));
	}

	if (filters?.startDate && filters?.endDate) {
		conditions.push(
			between(
				attendanceSessions.sessionDate,
				filters.startDate,
				filters.endDate,
			),
		);
	} else if (filters?.startDate) {
		conditions.push(gte(attendanceSessions.sessionDate, filters.startDate));
	} else if (filters?.endDate) {
		conditions.push(lte(attendanceSessions.sessionDate, filters.endDate));
	}

	return db
		.select()
		.from(attendanceSessions)
		.where(and(...conditions))
		.orderBy(attendanceSessions.sessionDate);
}

export async function insertSession(
	data: typeof attendanceSessions.$inferInsert,
) {
	const [row] = await db.insert(attendanceSessions).values(data).returning();
	return row!;
}

export async function updateSession(
	sessionId: string,
	institutionId: string,
	data: Partial<typeof attendanceSessions.$inferInsert>,
) {
	const [row] = await db
		.update(attendanceSessions)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(attendanceSessions.id, sessionId),
				eq(attendanceSessions.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

export async function deleteSession(sessionId: string, institutionId: string) {
	const [row] = await db
		.delete(attendanceSessions)
		.where(
			and(
				eq(attendanceSessions.id, sessionId),
				eq(attendanceSessions.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

// ─── Record queries ──────────────────────────────────────────────────────────

export async function findRecordById(recordId: string, institutionId: string) {
	const rows = await db
		.select()
		.from(attendanceRecords)
		.where(
			and(
				eq(attendanceRecords.id, recordId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findRecordsBySession(
	sessionId: string,
	institutionId: string,
) {
	return db
		.select()
		.from(attendanceRecords)
		.where(
			and(
				eq(attendanceRecords.sessionId, sessionId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.orderBy(attendanceRecords.studentId);
}

export async function findRecordBySessionAndStudent(
	sessionId: string,
	studentId: string,
	institutionId: string,
) {
	const rows = await db
		.select()
		.from(attendanceRecords)
		.where(
			and(
				eq(attendanceRecords.sessionId, sessionId),
				eq(attendanceRecords.studentId, studentId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.limit(1);
	return rows[0] ?? null;
}

export async function findStudentHistory(
	institutionId: string,
	studentId: string,
	filters?: {
		classId?: string;
		startDate?: Date;
		endDate?: Date;
	},
) {
	const conditions = [
		eq(attendanceRecords.institutionId, institutionId),
		eq(attendanceRecords.studentId, studentId),
	];

	if (filters?.startDate && filters?.endDate) {
		// Use a subquery to check session dates
		const sessionsWithDateRange = db.$with("sessions_date_range").as(
			db
				.select({ id: attendanceSessions.id })
				.from(attendanceSessions)
				.where(
					between(
						attendanceSessions.sessionDate,
						filters.startDate,
						filters.endDate,
					),
				),
		);

		return db
			.with(sessionsWithDateRange)
			.select()
			.from(attendanceRecords)
			.where(
				and(
					eq(attendanceRecords.institutionId, institutionId),
					eq(attendanceRecords.studentId, studentId),
					sql`session_id IN (SELECT id FROM ${sessionsWithDateRange})`,
				),
			)
			.orderBy(attendanceRecords.createdAt);
	}
	if (filters?.startDate) {
		const sessionsWithStartDate = db
			.$with("sessions_start")
			.as(
				db
					.select({ id: attendanceSessions.id })
					.from(attendanceSessions)
					.where(gte(attendanceSessions.sessionDate, filters.startDate)),
			);

		return db
			.with(sessionsWithStartDate)
			.select()
			.from(attendanceRecords)
			.where(
				and(
					eq(attendanceRecords.institutionId, institutionId),
					eq(attendanceRecords.studentId, studentId),
					sql`session_id IN (SELECT id FROM ${sessionsWithStartDate})`,
				),
			)
			.orderBy(attendanceRecords.createdAt);
	}
	if (filters?.endDate) {
		const sessionsWithEndDate = db
			.$with("sessions_end")
			.as(
				db
					.select({ id: attendanceSessions.id })
					.from(attendanceSessions)
					.where(lte(attendanceSessions.sessionDate, filters.endDate)),
			);

		return db
			.with(sessionsWithEndDate)
			.select()
			.from(attendanceRecords)
			.where(
				and(
					eq(attendanceRecords.institutionId, institutionId),
					eq(attendanceRecords.studentId, studentId),
					sql`session_id IN (SELECT id FROM ${sessionsWithEndDate})`,
				),
			)
			.orderBy(attendanceRecords.createdAt);
	}

	return db
		.select()
		.from(attendanceRecords)
		.where(and(...conditions))
		.orderBy(attendanceRecords.createdAt);
}

export async function insertRecord(
	data: typeof attendanceRecords.$inferInsert,
) {
	const [row] = await db.insert(attendanceRecords).values(data).returning();
	return row!;
}

export async function insertManyRecords(
	data: (typeof attendanceRecords.$inferInsert)[],
) {
	return db.insert(attendanceRecords).values(data).returning();
}

export async function updateRecord(
	recordId: string,
	institutionId: string,
	data: Partial<typeof attendanceRecords.$inferInsert>,
) {
	const [row] = await db
		.update(attendanceRecords)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(attendanceRecords.id, recordId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

export async function deleteRecord(recordId: string, institutionId: string) {
	const [row] = await db
		.delete(attendanceRecords)
		.where(
			and(
				eq(attendanceRecords.id, recordId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.returning();
	return row ?? null;
}

export async function deleteRecordsBySession(
	sessionId: string,
	institutionId: string,
) {
	return db
		.delete(attendanceRecords)
		.where(
			and(
				eq(attendanceRecords.sessionId, sessionId),
				eq(attendanceRecords.institutionId, institutionId),
			),
		)
		.returning();
}
