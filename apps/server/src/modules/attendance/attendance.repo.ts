import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import type {
	NewAttendanceRecord,
	NewAttendanceSession,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

export async function createSession(data: NewAttendanceSession) {
	const [row] = await db
		.insert(schema.attendanceSessions)
		.values(data)
		.returning();
	return row;
}

export async function findSessionById(id: string, institutionId: string) {
	return db.query.attendanceSessions.findFirst({
		where: and(
			eq(schema.attendanceSessions.id, id),
			eq(schema.attendanceSessions.institutionId, institutionId),
		),
		with: {
			classCourse: { with: { classRef: true, courseRef: true } },
			records: {
				with: {
					student: { with: { profile: true } },
				},
				orderBy: (r, { asc }) => [asc(r.studentId)],
			},
		},
	});
}

export async function findSessionByCourseDateForWrite(
	classCourseId: string,
	sessionDate: string,
	institutionId: string,
) {
	return db.query.attendanceSessions.findFirst({
		where: and(
			eq(schema.attendanceSessions.classCourseId, classCourseId),
			eq(schema.attendanceSessions.sessionDate, sessionDate),
			eq(schema.attendanceSessions.institutionId, institutionId),
		),
		columns: { id: true },
	});
}

export async function listSessions(
	institutionId: string,
	opts: {
		classCourseId?: string;
		academicYearId?: string;
		dateFrom?: string;
		dateTo?: string;
	},
) {
	const conditions = [
		eq(schema.attendanceSessions.institutionId, institutionId),
	];
	if (opts.classCourseId)
		conditions.push(
			eq(schema.attendanceSessions.classCourseId, opts.classCourseId),
		);
	if (opts.academicYearId)
		conditions.push(
			eq(schema.attendanceSessions.academicYearId, opts.academicYearId),
		);
	if (opts.dateFrom)
		conditions.push(gte(schema.attendanceSessions.sessionDate, opts.dateFrom));
	if (opts.dateTo)
		conditions.push(lte(schema.attendanceSessions.sessionDate, opts.dateTo));

	return db.query.attendanceSessions.findMany({
		where: and(...conditions),
		with: {
			classCourse: { with: { classRef: true, courseRef: true } },
			records: { columns: { id: true, status: true, studentId: true } },
		},
		orderBy: (t, { desc }) => [desc(t.sessionDate)],
	});
}

export async function deleteSession(id: string, institutionId: string) {
	await db
		.delete(schema.attendanceSessions)
		.where(
			and(
				eq(schema.attendanceSessions.id, id),
				eq(schema.attendanceSessions.institutionId, institutionId),
			),
		);
}

/** Replace all records for a session in one go (upsert semantics). */
export async function upsertRecords(
	records: NewAttendanceRecord[],
	institutionId: string,
	attendanceSessionId: string,
) {
	// Delete existing records for this session first
	await db
		.delete(schema.attendanceRecords)
		.where(
			and(
				eq(schema.attendanceRecords.attendanceSessionId, attendanceSessionId),
				eq(schema.attendanceRecords.institutionId, institutionId),
			),
		);
	if (records.length === 0) return [];
	return db.insert(schema.attendanceRecords).values(records).returning();
}

export async function updateRecord(
	attendanceSessionId: string,
	studentId: string,
	data: Partial<
		Pick<
			NewAttendanceRecord,
			"status" | "excuseReason" | "excuseApprovedBy" | "excuseApprovedAt"
		>
	>,
	institutionId: string,
) {
	const [row] = await db
		.update(schema.attendanceRecords)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.attendanceRecords.attendanceSessionId, attendanceSessionId),
				eq(schema.attendanceRecords.studentId, studentId),
				eq(schema.attendanceRecords.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

export async function findRecordById(id: string, institutionId: string) {
	return db.query.attendanceRecords.findFirst({
		where: and(
			eq(schema.attendanceRecords.id, id),
			eq(schema.attendanceRecords.institutionId, institutionId),
		),
	});
}

export async function listRecordsForStudent(
	studentId: string,
	institutionId: string,
	classCourseId?: string,
) {
	const sessions = await db.query.attendanceSessions.findMany({
		where: and(
			eq(schema.attendanceSessions.institutionId, institutionId),
			...(classCourseId
				? [eq(schema.attendanceSessions.classCourseId, classCourseId)]
				: []),
		),
		columns: { id: true },
	});
	if (sessions.length === 0) return [];
	const { inArray } = await import("drizzle-orm");
	return db.query.attendanceRecords.findMany({
		where: and(
			eq(schema.attendanceRecords.studentId, studentId),
			eq(schema.attendanceRecords.institutionId, institutionId),
			inArray(
				schema.attendanceRecords.attendanceSessionId,
				sessions.map((s) => s.id),
			),
		),
	});
}

export async function getSessionsWithRecordCounts(
	classCourseId: string,
	institutionId: string,
) {
	return db.query.attendanceSessions.findMany({
		where: and(
			eq(schema.attendanceSessions.classCourseId, classCourseId),
			eq(schema.attendanceSessions.institutionId, institutionId),
		),
		with: {
			records: {
				columns: { id: true, status: true, studentId: true },
			},
		},
		orderBy: (t, { asc }) => [asc(t.sessionDate)],
	});
}

/** Fetch enrolled students for a classCourse to build roster. */
export async function getRosterForClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	return db.query.studentCourseEnrollments.findMany({
		where: and(
			eq(schema.studentCourseEnrollments.classCourseId, classCourseId),
			eq(schema.studentCourseEnrollments.status, "active"),
		),
		with: {
			student: {
				with: { profile: true },
				columns: { id: true, registrationNumber: true },
			},
		},
		columns: { studentId: true },
	});
}

/** Upsert a single attendance record (insert or update on conflict). */
export async function upsertSingleRecord(
	data: Pick<
		NewAttendanceRecord,
		| "institutionId"
		| "attendanceSessionId"
		| "studentId"
		| "status"
		| "markedBy"
	>,
) {
	const [row] = await db
		.insert(schema.attendanceRecords)
		.values(data)
		.onConflictDoUpdate({
			target: [
				schema.attendanceRecords.attendanceSessionId,
				schema.attendanceRecords.studentId,
			],
			set: {
				status: data.status,
				markedBy: data.markedBy,
				updatedAt: new Date(),
			},
		})
		.returning();
	return row;
}

/** Fetch status types */
export function getAttendanceStatusTypes() {
	return schema.attendanceStatuses;
}
