import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	createClassCourse,
	createDomainUser,
	createStudent,
	makeTestContext,
} from "../../../lib/test-utils";
import * as repo from "../attendance.repo";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

/** Admin caller backed by a real DB profile so `created_by` FK passes. */
async function makeAdmin() {
	const profile = await createDomainUser();
	const ctx = makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
	return createCaller(ctx);
}

/** Enroll a student into a classCourse so they appear on the roster. */
async function enrollStudent(studentId: string, classCourseId: string) {
	const cc = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc) throw new Error("classCourse not found");
	await db
		.insert(schema.studentCourseEnrollments)
		.values({
			studentId,
			classCourseId,
			courseId: cc.course,
			sourceClassId: cc.class,
			academicYearId: cc.classRef!.academicYear,
			status: "active",
			creditsAttempted: 3,
		})
		.onConflictDoNothing();
}

// ── Access control ──────────────────────────────────────────────────────────

describe("attendance auth", () => {
	it("createSession is forbidden for students", async () => {
		const student = createCaller(makeTestContext({ role: "student" }));
		await expect(
			student.attendance.createSession({
				classCourseId: "cc",
				sessionDate: TODAY,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("listSessions requires authentication", async () => {
		const unauthenticated = createCaller(makeTestContext());
		await expect(
			unauthenticated.attendance.listSessions({}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("getAttendanceRates is forbidden for students", async () => {
		const student = createCaller(makeTestContext({ role: "student" }));
		await expect(
			student.attendance.getAttendanceRates({ classCourseId: "cc" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("getRoster is forbidden for students", async () => {
		const student = createCaller(makeTestContext({ role: "student" }));
		await expect(
			student.attendance.getRoster({ classCourseId: "cc" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Session creation (JVL-50) ────────────────────────────────────────────────

describe("session management", () => {
	it("creates a session idempotently (same date returns same id)", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();

		const s1 = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		const s2 = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		expect(s1.id).toBe(s2.id);
	});

	it("rejects a courseSessionId that does not belong to the classCourse", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		await expect(
			admin.attendance.createSession({
				classCourseId: cc.id,
				sessionDate: TODAY,
				courseSessionId: "nonexistent-id",
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("lists sessions filtered by dateFrom", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();

		await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: YESTERDAY,
			isExceptional: true,
		});

		const recent = await admin.attendance.listSessions({
			classCourseId: cc.id,
			dateFrom: TODAY,
		});
		expect(recent.every((s) => s.sessionDate >= TODAY)).toBe(true);
		expect(recent.some((s) => s.sessionDate === TODAY)).toBe(true);
	});

	it("deletes a session", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		await admin.attendance.deleteSession({ id: session.id });
		const sessions = await admin.attendance.listSessions({
			classCourseId: cc.id,
		});
		expect(sessions.every((s) => s.id !== session.id)).toBe(true);
	});
});

// ── Bulk mark (JVL-51) ───────────────────────────────────────────────────────

describe("bulk mark", () => {
	it("marks all enrolled students absent when records array is empty", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		const result = await admin.attendance.bulkMark({
			attendanceSessionId: session.id,
			records: [],
		});
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result.every((r) => r.status === "absent")).toBe(true);
	});

	it("rejects student not enrolled in the class course", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const outsider = await createStudent({ institutionId: cc.institutionId });
		// Not enrolled

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		await expect(
			admin.attendance.bulkMark({
				attendanceSessionId: session.id,
				records: [{ studentId: outsider.id, status: "present" }],
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("students missing from bulk mark input default to absent", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const s1 = await createStudent({ institutionId: cc.institutionId });
		const s2 = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(s1.id, cc.id);
		await enrollStudent(s2.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		await admin.attendance.bulkMark({
			attendanceSessionId: session.id,
			records: [{ studentId: s1.id, status: "present" }],
		});

		const detail = await admin.attendance.getSession({ id: session.id });
		const r1 = detail.records.find((r) => r.studentId === s1.id);
		const r2 = detail.records.find((r) => r.studentId === s2.id);
		expect(r1?.status).toBe("present");
		expect(r2?.status).toBe("absent");
	});
});

// ── Excuse absence (JVL-52) ──────────────────────────────────────────────────

describe("excuse absence", () => {
	async function setupRecordWithStatus(status: "present" | "absent" | "late") {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		await admin.attendance.updateRecord({
			attendanceSessionId: session.id,
			studentId: student.id,
			status,
		});
		const detail = await admin.attendance.getSession({ id: session.id });
		const record = detail.records.find((r) => r.studentId === student.id)!;
		return { admin, record };
	}

	it("excuses an absent record", async () => {
		const { admin, record } = await setupRecordWithStatus("absent");
		const result = await admin.attendance.excuseAbsence({
			attendanceRecordId: record.id,
			excuseReason: "Medical",
			approve: true,
		});
		expect(result?.status).toBe("excused");
		expect(result?.excuseReason).toBe("Medical");
	});

	it("excuses a late record", async () => {
		const { admin, record } = await setupRecordWithStatus("late");
		const result = await admin.attendance.excuseAbsence({
			attendanceRecordId: record.id,
			excuseReason: "Traffic",
			approve: true,
		});
		expect(result?.status).toBe("excused");
	});

	it("rejects excusing a present record", async () => {
		const { admin, record } = await setupRecordWithStatus("present");
		await expect(
			admin.attendance.excuseAbsence({
				attendanceRecordId: record.id,
				excuseReason: "N/A",
				approve: true,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("clears excuse metadata when status changes back to non-excused", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		await admin.attendance.updateRecord({
			attendanceSessionId: session.id,
			studentId: student.id,
			status: "absent",
		});
		const detail1 = await admin.attendance.getSession({ id: session.id });
		const rec = detail1.records.find((r) => r.studentId === student.id)!;
		await admin.attendance.excuseAbsence({
			attendanceRecordId: rec.id,
			excuseReason: "Sick",
			approve: true,
		});

		await admin.attendance.updateRecord({
			attendanceSessionId: session.id,
			studentId: student.id,
			status: "present",
		});

		const detail2 = await admin.attendance.getSession({ id: session.id });
		const updated = detail2.records.find((r) => r.studentId === student.id);
		expect(updated?.excuseReason).toBeNull();
		expect(updated?.excuseApprovedBy).toBeNull();
	});
});

// ── Attendance rates (JVL-53) ────────────────────────────────────────────────

describe("attendance rates", () => {
	it("enrolled student with no records appears with 0% rate", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		const rates = await admin.attendance.getAttendanceRates({
			classCourseId: cc.id,
		});
		const sr = rates.students.find((s) => s.studentId === student.id);
		expect(sr).toBeDefined();
		expect(sr?.rate).toBe(0);
		expect(sr?.absent).toBe(1);
	});

	it("excused records do not reduce the attendance rate", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		await admin.attendance.updateRecord({
			attendanceSessionId: session.id,
			studentId: student.id,
			status: "absent",
		});
		const detail = await admin.attendance.getSession({ id: session.id });
		const rec = detail.records.find((r) => r.studentId === student.id)!;
		await admin.attendance.excuseAbsence({
			attendanceRecordId: rec.id,
			excuseReason: "Medical",
			approve: true,
		});

		const rates = await admin.attendance.getAttendanceRates({
			classCourseId: cc.id,
		});
		const sr = rates.students.find((s) => s.studentId === student.id);
		expect(sr?.excused).toBe(1);
		expect(sr?.rate).toBe(100);
	});
});

// ── Eligibility threshold (JVL-54) ───────────────────────────────────────────

describe("attendance eligibility", () => {
	it("returns null when no threshold is configured", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const result = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(result).toBeNull();
	});

	it("threshold of 0 is not treated as disabled", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		await admin.attendance.setThreshold({ classCourseId: cc.id, threshold: 0 });

		const result = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(result).not.toBeNull();
		expect(result?.threshold).toBe(0);
		expect(result?.eligible).toBe(true);
	});

	it("student below threshold is not eligible", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		await admin.attendance.setThreshold({
			classCourseId: cc.id,
			threshold: 75,
		});

		// 4 sessions; student present for 2 → 50%
		for (let i = 0; i < 4; i++) {
			const date = new Date(Date.now() - i * 86400000)
				.toISOString()
				.slice(0, 10);
			const sess = await admin.attendance.createSession({
				classCourseId: cc.id,
				sessionDate: date,
				isExceptional: true,
			});
			if (i < 2) {
				await admin.attendance.updateRecord({
					attendanceSessionId: sess.id,
					studentId: student.id,
					status: "present",
				});
			}
			// sessions i>=2: no record → counted as absent
		}

		const result = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(result?.eligible).toBe(false);
		expect(result?.rate).toBe(50);
	});

	it("rejects eligibility check for unenrolled student", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const outsider = await createStudent({ institutionId: cc.institutionId });

		await admin.attendance.setThreshold({
			classCourseId: cc.id,
			threshold: 80,
		});

		await expect(
			admin.attendance.checkEligibility({
				studentId: outsider.id,
				classCourseId: cc.id,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("checkEligibility: teacher cannot check a course they do not own", async () => {
		const cc = await createClassCourse();
		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.checkEligibility({
				studentId: "any-student",
				classCourseId: cc.id,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Session model invariants (JVL-50) ────────────────────────────────────────

describe("session model invariants", () => {
	it("rejects session without courseSessionId when isExceptional is not set", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		await expect(
			admin.attendance.createSession({
				classCourseId: cc.id,
				sessionDate: TODAY,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("accepts session without courseSessionId when isExceptional is true", async () => {
		const admin = await makeAdmin();
		const cc = await createClassCourse();
		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		expect(session.id).toBeDefined();
	});
});

// ── Read scoping (JVL-51) ────────────────────────────────────────────────────

describe("read scoping", () => {
	it("getSession: teacher cannot read a session from another teacher's course", async () => {
		const cc = await createClassCourse();
		const adminProfile = await createDomainUser();
		const admin = createCaller(
			makeTestContext({
				role: "administrator",
				profileOverrides: { id: adminProfile.id },
			}),
		);
		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.getSession({ id: session.id }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("listSessions: teacher without classCourseId gets FORBIDDEN", async () => {
		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(caller.attendance.listSessions({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});

	it("listSessions: teacher cannot list another teacher's course", async () => {
		const cc = await createClassCourse();
		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.listSessions({ classCourseId: cc.id }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("getRoster: teacher cannot read roster for another teacher's course", async () => {
		const cc = await createClassCourse();
		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.getRoster({ classCourseId: cc.id }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("getAttendanceRates: teacher cannot read rates for another teacher's course", async () => {
		const cc = await createClassCourse();
		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.getAttendanceRates({ classCourseId: cc.id }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Excuse scoping (JVL-52) ──────────────────────────────────────────────────

describe("excuse scoping", () => {
	it("teacher cannot excuse a record outside their assigned course", async () => {
		const cc = await createClassCourse();
		const adminProfile = await createDomainUser();
		const admin = createCaller(
			makeTestContext({
				role: "administrator",
				profileOverrides: { id: adminProfile.id },
			}),
		);
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});
		await admin.attendance.updateRecord({
			attendanceSessionId: session.id,
			studentId: student.id,
			status: "absent",
		});
		const detail = await admin.attendance.getSession({ id: session.id });
		const record = detail.records.find((r) => r.studentId === student.id)!;

		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.excuseAbsence({
				attendanceRecordId: record.id,
				excuseReason: "Unauthorized excuse",
				approve: true,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Regression: sessionDate in courseSessionId idempotency (JVL-50) ──────────

describe("session idempotency regression (JVL-50)", () => {
	/** Resolve the academicYearId for a classCourse. */
	async function getAcademicYearForCc(classCourseId: string) {
		const cc = await db.query.classCourses.findFirst({
			where: eq(schema.classCourses.id, classCourseId),
			with: { classRef: { columns: { academicYear: true } } },
		});
		return cc!.classRef!.academicYear;
	}

	it("courseSessionId branch distinguishes sessions by sessionDate", async () => {
		const cc = await createClassCourse();
		const institutionId = cc.institutionId;
		const academicYearId = await getAcademicYearForCc(cc.id);
		// Create a real courseSession (timetable slot) so the FK is satisfied
		const [cs] = await db
			.insert(schema.courseSessions)
			.values({
				classCourseId: cc.id,
				institutionId,
				academicYearId,
				dayOfWeek: "mon",
				startTime: "08:00",
				endTime: "09:00",
			})
			.returning({ id: schema.courseSessions.id });
		const courseSessionId = cs.id;
		// The same recurring slot appears on two different Mondays
		const [s1] = await db
			.insert(schema.attendanceSessions)
			.values({
				classCourseId: cc.id,
				institutionId,
				academicYearId,
				courseSessionId,
				sessionDate: "2025-03-03",
				isExceptional: false,
			})
			.returning({ id: schema.attendanceSessions.id });
		const [s2] = await db
			.insert(schema.attendanceSessions)
			.values({
				classCourseId: cc.id,
				institutionId,
				academicYearId,
				courseSessionId,
				sessionDate: "2025-03-10",
				isExceptional: false,
			})
			.returning({ id: schema.attendanceSessions.id });

		const found1 = await repo.findSessionByCourseDateForWrite(
			cc.id,
			"2025-03-03",
			institutionId,
			courseSessionId,
		);
		const found2 = await repo.findSessionByCourseDateForWrite(
			cc.id,
			"2025-03-10",
			institutionId,
			courseSessionId,
		);

		expect(found1?.id).toBe(s1.id);
		expect(found2?.id).toBe(s2.id);
	});
});

// ── Regression: cross-tenant roster (JVL-51) ─────────────────────────────────

describe("cross-tenant roster regression (JVL-51)", () => {
	it("getRosterForClassCourse returns empty when institutionId does not match", async () => {
		const cc = await createClassCourse();
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		// Same classCourseId but wrong institution → should be empty
		const result = await repo.getRosterForClassCourse(cc.id, randomUUID());
		expect(result).toHaveLength(0);
	});
});

// ── Attendance exemption (JVL-54 override audité) ────────────────────────────

describe("attendance exemption", () => {
	async function setupBelowThreshold() {
		const admin = await makeAdmin();
		const cc = await createClassCourse({ attendanceThreshold: 75 });
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);
		const ccFull = await db.query.classCourses.findFirst({
			where: eq(schema.classCourses.id, cc.id),
			with: { classRef: { columns: { academicYear: true } } },
		});
		const academicYearId = ccFull!.classRef!.academicYear;
		// 2 sessions, no records → student at 0%
		for (let i = 0; i < 2; i++) {
			await db.insert(schema.attendanceSessions).values({
				classCourseId: cc.id,
				institutionId: cc.institutionId,
				academicYearId,
				sessionDate: new Date(Date.now() - (i + 20) * 86400000)
					.toISOString()
					.slice(0, 10),
				isExceptional: true,
			});
		}
		return { admin, cc, student };
	}

	it("exemption makes a below-threshold student eligible for exams", async () => {
		const { admin, cc, student } = await setupBelowThreshold();

		// Not eligible without exemption
		const before = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(before?.eligible).toBe(false);

		// Grant exemption
		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "Medical certificate submitted",
		});

		// Now eligible with exempted flag
		const after = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(after?.eligible).toBe(true);
		expect(after?.exempted).toBe(true);
	});

	it("revoking exemption restores ineligibility", async () => {
		const { admin, cc, student } = await setupBelowThreshold();

		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "Approved",
		});
		await admin.attendance.revokeExemption({
			classCourseId: cc.id,
			studentId: student.id,
		});

		const result = await admin.attendance.checkEligibility({
			studentId: student.id,
			classCourseId: cc.id,
		});
		expect(result?.eligible).toBe(false);
		expect(result?.exempted).toBeUndefined();
	});

	it("non-admin cannot grant exemptions", async () => {
		const cc = await createClassCourse();
		const teacher = createCaller(makeTestContext({ role: "teacher" }));
		await expect(
			teacher.attendance.grantExemption({
				classCourseId: cc.id,
				studentId: "any",
				reason: "x",
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Exemption audit log (JVL-54 immutable trail) ─────────────────────────────

describe("attendance exemption audit log", () => {
	async function setupBelowThresholdWithAdmin() {
		const profile = await createDomainUser();
		const admin = createCaller(
			makeTestContext({
				role: "administrator",
				profileOverrides: { id: profile.id },
			}),
		);
		const cc = await createClassCourse({ attendanceThreshold: 75 });
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);
		const ccFull = await db.query.classCourses.findFirst({
			where: eq(schema.classCourses.id, cc.id),
			with: { classRef: { columns: { academicYear: true } } },
		});
		const academicYearId = ccFull!.classRef!.academicYear;
		for (let i = 0; i < 2; i++) {
			await db.insert(schema.attendanceSessions).values({
				classCourseId: cc.id,
				institutionId: cc.institutionId,
				academicYearId,
				sessionDate: new Date(Date.now() - (i + 50) * 86400000)
					.toISOString()
					.slice(0, 10),
				isExceptional: true,
			});
		}
		return { admin, cc, student };
	}

	it("grantExemption writes an immutable log entry", async () => {
		const { admin, cc, student } = await setupBelowThresholdWithAdmin();

		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "Medical certificate",
		});

		const logs = await repo.findExemptionLogs(
			cc.id,
			student.id,
			cc.institutionId,
		);
		expect(logs.length).toBe(1);
		expect(logs[0].action).toBe("granted");
		expect(logs[0].reason).toBe("Medical certificate");
	});

	it("revokeExemption appends a revoke log and removes current state", async () => {
		const { admin, cc, student } = await setupBelowThresholdWithAdmin();

		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "Initial grant",
		});
		await admin.attendance.revokeExemption({
			classCourseId: cc.id,
			studentId: student.id,
		});

		const logs = await repo.findExemptionLogs(
			cc.id,
			student.id,
			cc.institutionId,
		);
		expect(logs.length).toBe(2);
		expect(logs[0].action).toBe("granted");
		expect(logs[1].action).toBe("revoked");

		const current = await repo.findExemption(
			cc.id,
			student.id,
			cc.institutionId,
		);
		expect(current).toBeUndefined();
	});

	it("granting twice preserves full history (two log rows)", async () => {
		const { admin, cc, student } = await setupBelowThresholdWithAdmin();

		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "First reason",
		});
		await admin.attendance.grantExemption({
			classCourseId: cc.id,
			studentId: student.id,
			reason: "Updated reason",
		});

		const logs = await repo.findExemptionLogs(
			cc.id,
			student.id,
			cc.institutionId,
		);
		expect(logs.length).toBe(2);
		expect(logs[0].reason).toBe("First reason");
		expect(logs[1].reason).toBe("Updated reason");
	});
});

// ── Marking auth (JVL-51) ────────────────────────────────────────────────────

describe("marking auth", () => {
	it("bulkMark: teacher cannot mark sessions for another teacher's course", async () => {
		const cc = await createClassCourse();
		const profile = await createDomainUser();
		const session = await createCaller(
			makeTestContext({
				role: "administrator",
				profileOverrides: { id: profile.id },
			}),
		).attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		const otherTeacher = await createDomainUser();
		const caller = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: otherTeacher.id },
			}),
		);
		await expect(
			caller.attendance.bulkMark({
				attendanceSessionId: session.id,
				records: [],
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("updateRecord: excused status is rejected — must use excuseAbsence", async () => {
		const profile = await createDomainUser();
		const cc = await createClassCourse({ teacher: profile.id });
		const student = await createStudent({ institutionId: cc.institutionId });
		await enrollStudent(student.id, cc.id);

		const adminCtx = makeTestContext({
			role: "administrator",
			profileOverrides: { id: profile.id },
		});
		const admin = createCaller(adminCtx);
		const session = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
			isExceptional: true,
		});

		await expect(
			admin.attendance.updateRecord({
				attendanceSessionId: session.id,
				studentId: student.id,
				status: "excused" as never,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});
});
