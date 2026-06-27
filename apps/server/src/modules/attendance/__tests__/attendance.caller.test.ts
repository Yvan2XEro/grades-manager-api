import { describe, expect, it } from "bun:test";
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
		});
		const s2 = await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: TODAY,
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
		});
		await admin.attendance.createSession({
			classCourseId: cc.id,
			sessionDate: YESTERDAY,
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
});
