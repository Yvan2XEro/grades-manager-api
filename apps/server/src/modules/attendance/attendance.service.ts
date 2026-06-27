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
	// Idempotent: return existing session if one already exists for this date
	const existing = await repo.findSessionByCourseDateForWrite(
		input.classCourseId,
		input.sessionDate,
		institutionId,
	);
	if (existing) return existing;

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

/** Replace all attendance records for a session. Missing students get "absent". */
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

	const newRecords = records.map((r) => ({
		institutionId,
		attendanceSessionId,
		studentId: r.studentId,
		status: r.status,
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

	return repo.upsertSingleRecord({
		institutionId,
		attendanceSessionId,
		studentId,
		status,
		markedBy: markedBy ?? null,
	});
}

/** Approve or set an excuse reason for an absent/late record. */
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

/** Compute attendance rates per student for a given classCourse. */
export async function getAttendanceRates(
	classCourseId: string,
	institutionId: string,
	academicYearId?: string,
) {
	const sessions = await repo.getSessionsWithRecordCounts(
		classCourseId,
		institutionId,
	);

	const totalSessions = sessions.length;
	if (totalSessions === 0) return { totalSessions: 0, students: [] };

	// Collect all student ids across all sessions
	const studentMap = new Map<
		string,
		{ present: number; absent: number; late: number; excused: number }
	>();

	for (const s of sessions) {
		for (const r of s.records) {
			if (!studentMap.has(r.studentId)) {
				studentMap.set(r.studentId, {
					present: 0,
					absent: 0,
					late: 0,
					excused: 0,
				});
			}
			const counts = studentMap.get(r.studentId)!;
			counts[r.status as "present" | "absent" | "late" | "excused"]++;
		}
	}

	const students = Array.from(studentMap.entries()).map(
		([studentId, counts]) => {
			const attended = counts.present + counts.late; // late counts as attended
			const effective = counts.present + counts.late + counts.absent; // excused don't count against
			const rate =
				effective > 0 ? Math.round((attended / effective) * 100) : 100;
			return { studentId, ...counts, totalSessions, rate };
		},
	);

	return { totalSessions, students };
}

/** Fetch the roster of active students for a course, useful for the marking sheet. */
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

	if (!cc?.attendanceThreshold) return null;
	const threshold = cc.attendanceThreshold;

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
