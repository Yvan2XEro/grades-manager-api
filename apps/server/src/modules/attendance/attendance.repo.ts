import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import type {
	NewAttendanceRecord,
	NewAttendanceSession,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

// ── Attendance exemption CRUD + immutable audit log ──────────────────────────

export async function findExemption(
	classCourseId: string,
	studentId: string,
	institutionId: string,
) {
	return db.query.attendanceExemptions.findFirst({
		where: and(
			eq(schema.attendanceExemptions.classCourseId, classCourseId),
			eq(schema.attendanceExemptions.studentId, studentId),
			eq(schema.attendanceExemptions.institutionId, institutionId),
		),
	});
}

export async function grantExemption(data: {
	classCourseId: string;
	studentId: string;
	institutionId: string;
	reason: string;
	grantedBy: string | null;
}) {
	return db.transaction(async (tx) => {
		await tx.insert(schema.attendanceExemptionLogs).values({
			institutionId: data.institutionId,
			classCourseId: data.classCourseId,
			studentId: data.studentId,
			action: "granted",
			reason: data.reason,
			actorId: data.grantedBy,
		});
		const [row] = await tx
			.insert(schema.attendanceExemptions)
			.values(data)
			.onConflictDoUpdate({
				target: [
					schema.attendanceExemptions.classCourseId,
					schema.attendanceExemptions.studentId,
				],
				set: {
					reason: data.reason,
					grantedBy: data.grantedBy,
					grantedAt: new Date(),
				},
			})
			.returning();
		return row;
	});
}

export async function revokeExemption(
	classCourseId: string,
	studentId: string,
	institutionId: string,
	actorId: string | null,
): Promise<{ success: boolean; notFound?: true }> {
	return db.transaction(async (tx) => {
		const deleted = await tx
			.delete(schema.attendanceExemptions)
			.where(
				and(
					eq(schema.attendanceExemptions.classCourseId, classCourseId),
					eq(schema.attendanceExemptions.studentId, studentId),
					eq(schema.attendanceExemptions.institutionId, institutionId),
				),
			)
			.returning({ id: schema.attendanceExemptions.id });

		if (deleted.length === 0) return { success: false, notFound: true };

		await tx.insert(schema.attendanceExemptionLogs).values({
			institutionId,
			classCourseId,
			studentId,
			action: "revoked",
			actorId,
		});

		return { success: true };
	});
}

export async function findExemptionLogs(
	classCourseId: string,
	studentId: string,
	institutionId: string,
) {
	return db.query.attendanceExemptionLogs.findMany({
		where: and(
			eq(schema.attendanceExemptionLogs.classCourseId, classCourseId),
			eq(schema.attendanceExemptionLogs.studentId, studentId),
			eq(schema.attendanceExemptionLogs.institutionId, institutionId),
		),
		orderBy: (t, { asc }) => [asc(t.createdAt)],
	});
}

/** Atomically updates an attendance record's excuse fields and inserts the immutable audit event.
 *  Both operations run in one transaction so an audit row never exists without the state change. */
export async function excuseAndAudit(data: {
	attendanceSessionId: string;
	studentId: string;
	institutionId: string;
	attendanceRecordId: string;
	excuseReason: string;
	newStatus: "excused" | "absent" | "late";
	excuseApprovedBy: string | null;
	excuseApprovedAt: Date | null;
	action: "approved" | "rejected";
	actorId: string;
}) {
	return db.transaction(async (tx) => {
		const [updated] = await tx
			.update(schema.attendanceRecords)
			.set({
				excuseReason: data.excuseReason,
				status: data.newStatus,
				excuseApprovedBy: data.excuseApprovedBy,
				excuseApprovedAt: data.excuseApprovedAt,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(schema.attendanceRecords.id, data.attendanceRecordId),
					eq(schema.attendanceRecords.institutionId, data.institutionId),
				),
			)
			.returning();
		await tx.insert(schema.attendanceExcuseAuditLogs).values({
			institutionId: data.institutionId,
			attendanceRecordId: data.attendanceRecordId,
			attendanceSessionId: data.attendanceSessionId,
			studentId: data.studentId,
			action: data.action,
			reason: data.excuseReason,
			actorId: data.actorId,
		});
		return updated;
	});
}

export async function createSession(data: NewAttendanceSession) {
	const [row] = await db
		.insert(schema.attendanceSessions)
		.values(data)
		.onConflictDoNothing()
		.returning({ id: schema.attendanceSessions.id });
	if (row) return row;
	// Concurrent insert won the race — re-fetch the winner by the same key
	return (await findSessionByCourseDateForWrite(
		data.classCourseId,
		data.sessionDate,
		data.institutionId,
		data.courseSessionId ?? undefined,
	))!;
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
	courseSessionId?: string,
) {
	const conditions = courseSessionId
		? [
				eq(schema.attendanceSessions.classCourseId, classCourseId),
				eq(schema.attendanceSessions.courseSessionId, courseSessionId),
				eq(schema.attendanceSessions.sessionDate, sessionDate),
				eq(schema.attendanceSessions.institutionId, institutionId),
			]
		: [
				eq(schema.attendanceSessions.classCourseId, classCourseId),
				eq(schema.attendanceSessions.sessionDate, sessionDate),
				eq(schema.attendanceSessions.institutionId, institutionId),
				isNull(schema.attendanceSessions.courseSessionId),
			];
	return db.query.attendanceSessions.findFirst({
		where: and(...conditions),
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

/** Replace all records for a session atomically (delete + insert in one transaction). */
export async function upsertRecords(
	records: NewAttendanceRecord[],
	institutionId: string,
	attendanceSessionId: string,
) {
	return db.transaction(async (tx) => {
		await tx
			.delete(schema.attendanceRecords)
			.where(
				and(
					eq(schema.attendanceRecords.attendanceSessionId, attendanceSessionId),
					eq(schema.attendanceRecords.institutionId, institutionId),
				),
			);
		if (records.length === 0) return [];
		return tx.insert(schema.attendanceRecords).values(records).returning();
	});
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
	opts: { academicYearId?: string; dateFrom?: string; dateTo?: string } = {},
) {
	const conditions = [
		eq(schema.attendanceSessions.classCourseId, classCourseId),
		eq(schema.attendanceSessions.institutionId, institutionId),
	];
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
			records: {
				columns: { id: true, status: true, studentId: true },
			},
		},
		orderBy: (t, { asc }) => [asc(t.sessionDate)],
	});
}

/** Fetch enrolled students for a classCourse to build roster.
 *  Validates that classCourseId belongs to institutionId before returning data. */
export async function getRosterForClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { id: true },
	});
	if (!cc) return [];

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

/** Upsert a single attendance record (insert or update on conflict).
 *  Clears excuse metadata when the status is changed away from "excused". */
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
	const clearExcuse = data.status !== "excused";
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
				...(clearExcuse
					? {
							excuseReason: null,
							excuseApprovedBy: null,
							excuseApprovedAt: null,
						}
					: {}),
			},
		})
		.returning();
	return row;
}

/** Fetch status types */
export function getAttendanceStatusTypes() {
	return schema.attendanceStatuses;
}

/** Return per-status counts and the list of absent/late students for one session. */
export async function getSessionSummary(
	attendanceSessionId: string,
	institutionId: string,
) {
	const session = await db.query.attendanceSessions.findFirst({
		where: and(
			eq(schema.attendanceSessions.id, attendanceSessionId),
			eq(schema.attendanceSessions.institutionId, institutionId),
		),
		with: {
			records: {
				with: {
					student: {
						columns: { id: true, registrationNumber: true },
						with: { profile: { columns: { firstName: true, lastName: true } } },
					},
				},
				columns: { id: true, status: true, studentId: true },
			},
		},
	});
	return session ?? null;
}

/** Return one row per classCourse in a class with session counts and rates. */
export async function getClassAttendanceOverview(
	classId: string,
	institutionId: string,
	academicYearId: string,
) {
	const classCourses = await db.query.classCourses.findMany({
		where: and(
			eq(schema.classCourses.class, classId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		with: {
			courseRef: { columns: { name: true } },
			attendanceSessions: {
				where: eq(schema.attendanceSessions.academicYearId, academicYearId),
				with: {
					records: { columns: { id: true, status: true, studentId: true } },
				},
				columns: { id: true },
			},
		},
		columns: {
			id: true,
			code: true,
			attendanceThreshold: true,
			attendanceExcusedCountsAsAbsent: true,
		},
	});
	return classCourses;
}
