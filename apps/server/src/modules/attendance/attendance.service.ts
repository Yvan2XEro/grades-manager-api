import { TRPCError } from "@trpc/server";
import * as repo from "./attendance.repo";

export async function createOrGetSession(
	input: {
		classCourseId: string;
		sessionDate: string;
		courseSessionId?: string;
		notes?: string;
	},
	institutionId: string,
	createdBy?: string,
) {
	// Idempotent: return existing session if one already exists for this date/slot
	const existing = await repo.findSessionByCourseDateForWrite(
		input.classCourseId,
		input.sessionDate,
		institutionId,
		input.courseSessionId,
	);
	if (existing) return existing;

	// Validate courseSessionId belongs to the same classCourse + institution
	if (input.courseSessionId) {
		const { db } = await import("@/db");
		const { and, eq } = await import("drizzle-orm");
		const schema = await import("@/db/schema/app-schema");
		const cs = await db.query.courseSessions.findFirst({
			where: and(
				eq(schema.courseSessions.id, input.courseSessionId),
				eq(schema.courseSessions.classCourseId, input.classCourseId),
				eq(schema.courseSessions.institutionId, institutionId),
			),
			columns: { id: true },
		});
		if (!cs)
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "courseSessionId does not belong to this classCourse",
			});
	}

	// Resolve academicYearId from classCourse
	const academicYearId = await resolveAcademicYearFromClassCourse(
		input.classCourseId,
		institutionId,
	);

	return repo.createSession({
		...input,
		institutionId,
		academicYearId,
		createdBy: createdBy ?? null,
	});
}

export async function getSession(id: string, institutionId: string) {
	const session = await repo.findSessionById(id, institutionId);
	if (!session)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Attendance session not found",
		});
	return session;
}

/** Get an attendance record with enough session context to check course ownership. */
export async function getAttendanceRecordById(
	id: string,
	institutionId: string,
) {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const record = await db.query.attendanceRecords.findFirst({
		where: and(
			eq(schema.attendanceRecords.id, id),
			eq(schema.attendanceRecords.institutionId, institutionId),
		),
		with: { attendanceSession: { columns: { classCourseId: true } } },
	});
	if (!record)
		throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
	return record;
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
	return repo.listSessions(institutionId, opts);
}

export async function deleteSession(id: string, institutionId: string) {
	const session = await repo.findSessionById(id, institutionId);
	if (!session)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Attendance session not found",
		});
	await repo.deleteSession(id, institutionId);
	return { success: true };
}

/** Replace attendance records for a session.
 *  Derives the full roster server-side; students absent from `records` get "absent". */
export async function bulkMark(
	attendanceSessionId: string,
	records: {
		studentId: string;
		status: "present" | "absent" | "late" | "excused";
	}[],
	institutionId: string,
	markedBy?: string,
) {
	const session = await repo.findSessionById(
		attendanceSessionId,
		institutionId,
	);
	if (!session)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Attendance session not found",
		});

	// Build a map of the explicit statuses provided by the caller
	const explicit = new Map(records.map((r) => [r.studentId, r.status]));

	// Derive the full roster from enrollments
	const roster = await repo.getRosterForClassCourse(
		session.classCourseId,
		institutionId,
	);

	// Validate all provided studentIds belong to the roster
	const rosterIds = new Set(roster.map((r) => r.studentId));
	for (const r of records) {
		if (!rosterIds.has(r.studentId)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Student ${r.studentId} is not enrolled in this class course`,
			});
		}
	}

	// Merge: explicit status takes precedence; missing students get "absent"
	const newRecords = roster.map((r) => ({
		institutionId,
		attendanceSessionId,
		studentId: r.studentId,
		status: explicit.get(r.studentId) ?? ("absent" as const),
		markedBy: markedBy ?? null,
	}));

	return repo.upsertRecords(newRecords, institutionId, attendanceSessionId);
}

/** Upsert a single student's status within a session. */
export async function updateRecord(
	attendanceSessionId: string,
	studentId: string,
	status: "present" | "absent" | "late" | "excused",
	institutionId: string,
	markedBy?: string,
) {
	const session = await repo.findSessionById(
		attendanceSessionId,
		institutionId,
	);
	if (!session)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Attendance session not found",
		});

	// Validate student is enrolled in this class course
	const roster = await repo.getRosterForClassCourse(
		session.classCourseId,
		institutionId,
	);
	if (!roster.some((r) => r.studentId === studentId)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Student is not enrolled in this class course",
		});
	}

	return repo.upsertSingleRecord({
		institutionId,
		attendanceSessionId,
		studentId,
		status,
		markedBy: markedBy ?? null,
	});
}

/** Approve or set an excuse reason for an absent/late record.
 *  Rejects records that are not "absent" or "late". */
export async function excuseAbsence(
	attendanceRecordId: string,
	excuseReason: string,
	approve: boolean,
	institutionId: string,
	approvedBy: string,
) {
	const record = await repo.findRecordById(attendanceRecordId, institutionId);
	if (!record)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Attendance record not found",
		});

	if (record.status !== "absent" && record.status !== "late") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot excuse a record with status "${record.status}". Only absent or late records can be excused.`,
		});
	}

	const updated = await repo.updateRecord(
		record.attendanceSessionId,
		record.studentId,
		{
			excuseReason,
			status: approve ? "excused" : record.status,
			excuseApprovedBy: approve ? approvedBy : null,
			excuseApprovedAt: approve ? new Date() : null,
		},
		institutionId,
	);
	return updated;
}

/** Compute attendance rates per student for a given classCourse.
 *  All enrolled students appear — those with no records show 0% / totalSessions absent. */
export async function getAttendanceRates(
	classCourseId: string,
	institutionId: string,
	academicYearId?: string,
) {
	const [sessions, roster] = await Promise.all([
		repo.getSessionsWithRecordCounts(
			classCourseId,
			institutionId,
			academicYearId,
		),
		repo.getRosterForClassCourse(classCourseId, institutionId),
	]);

	const totalSessions = sessions.length;
	if (totalSessions === 0) return { totalSessions: 0, students: [] };

	// Initialise counters for every enrolled student (not just those with records)
	const studentMap = new Map(
		roster.map((r) => [
			r.studentId,
			{ present: 0, absent: 0, late: 0, excused: 0 },
		]),
	);

	for (const s of sessions) {
		const seenInSession = new Set<string>();
		for (const r of s.records) {
			if (!studentMap.has(r.studentId)) continue; // guard: non-enrolled student
			seenInSession.add(r.studentId);
			const counts = studentMap.get(r.studentId)!;
			counts[r.status as "present" | "absent" | "late" | "excused"]++;
		}
		// Students with no record in this session count as absent
		for (const [sid, counts] of studentMap) {
			if (!seenInSession.has(sid)) counts.absent++;
		}
	}

	const students = Array.from(studentMap.entries()).map(
		([studentId, counts]) => {
			const attended = counts.present + counts.late;
			const effective = counts.present + counts.late + counts.absent; // excused excluded
			const rate =
				effective > 0 ? Math.round((attended / effective) * 100) : 100;
			return { studentId, ...counts, totalSessions, rate };
		},
	);

	return { totalSessions, students };
}

/** Fetch the roster of active students for a course. */
export async function getRoster(classCourseId: string, institutionId: string) {
	return repo.getRosterForClassCourse(classCourseId, institutionId);
}

/** Check if a student meets the attendance threshold for a class course.
 *  Returns null when no threshold is configured (gate disabled). */
export async function checkAttendanceEligibility(
	studentId: string,
	classCourseId: string,
	institutionId: string,
): Promise<{ eligible: boolean; rate: number; threshold: number } | null> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { attendanceThreshold: true },
	});

	// Explicit null check — threshold of 0 is a valid (very strict) gate
	if (cc?.attendanceThreshold == null) return null;
	const threshold = cc.attendanceThreshold;

	// Validate student is enrolled in this class course
	const roster = await repo.getRosterForClassCourse(
		classCourseId,
		institutionId,
	);
	if (!roster.some((r) => r.studentId === studentId)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Student is not enrolled in this class course",
		});
	}

	const sessions = await repo.getSessionsWithRecordCounts(
		classCourseId,
		institutionId,
	);
	const totalSessions = sessions.length;
	if (totalSessions === 0) return { eligible: true, rate: 100, threshold };

	let attended = 0;
	let effective = 0;
	for (const s of sessions) {
		const record = s.records.find((r) => r.studentId === studentId);
		if (!record) {
			// No record = treat as absent (consistent with getAttendanceRates)
			effective++;
			continue;
		}
		if (record.status === "present" || record.status === "late") attended++;
		if (record.status !== "excused") effective++;
	}

	const rate = effective > 0 ? Math.round((attended / effective) * 100) : 100;
	return { eligible: rate >= threshold, rate, threshold };
}

async function resolveAcademicYearFromClassCourse(
	classCourseId: string,
	institutionId: string,
): Promise<string> {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc?.classRef?.academicYear) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot resolve academic year for class course ${classCourseId}`,
		});
	}
	return cc.classRef.academicYear;
}
