import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { getTestInstitution } from "@/lib/test-context-state";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createClassCourse,
	createDomainUser,
	createStudent,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "../../../lib/test-utils";

async function createRoom(overrides: Partial<schema.NewRoom> = {}) {
	const institutionId = overrides.institutionId ?? getTestInstitution().id;
	const [room] = await db
		.insert(schema.rooms)
		.values({
			institutionId,
			code: `R-${randomUUID().slice(0, 6)}`,
			name: overrides.name ?? "Test Room",
			isActive: overrides.isActive ?? true,
			...overrides,
		})
		.returning();
	return room;
}

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

/** Resolve the academicYearId for a given classCourse */
async function getAcademicYear(classCourseId: string) {
	const cc = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, classCourseId),
		with: { classRef: { columns: { academicYear: true } } },
	});
	if (!cc?.classRef?.academicYear) throw new Error("no academic year");
	return cc.classRef.academicYear;
}

describe("timetable router", () => {
	it("requires auth for list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.timetable.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("requires admin role for list", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(caller.timetable.list({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});

	it("requires admin role for create", async () => {
		const caller = createCaller(makeTestContext({ role: "teacher" }));
		await expect(
			caller.timetable.create({
				classCourseId: "cc",
				academicYearId: "ay",
				dayOfWeek: "mon",
				startTime: "08:00",
				endTime: "10:00",
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("creates and lists sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		const { session } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
		});

		expect(session.classCourseId).toBe(cc.id);
		expect(session.dayOfWeek).toBe("mon");

		const sessions = await admin.timetable.list({ classCourseId: cc.id });
		expect(sessions.some((s) => s.id === session.id)).toBe(true);
	});

	it("blocks duplicate sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "tue",
			startTime: "10:00",
			endTime: "12:00",
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc.id,
				academicYearId,
				dayOfWeek: "tue",
				startTime: "10:00",
				endTime: "12:00",
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("blocks teacher double-booking within the same academic year", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		// Same teacher, same class (same academic year) — different course
		const cc2 = await createClassCourse({
			teacher: cc1.teacher,
			class: cc1.class,
		});
		const academicYearId = await getAcademicYear(cc1.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "wed",
			startTime: "08:00",
			endTime: "10:00",
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc2.id,
				academicYearId,
				dayOfWeek: "wed",
				startTime: "08:30",
				endTime: "10:30",
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("filters list by semesterId", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		// Create a session with the cc's semester, and one without
		const { session: s1 } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "09:00",
			semesterId: cc.semesterId ?? undefined,
		});
		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "10:00",
			endTime: "11:00",
			// no semesterId — session not linked to a semester
		});

		if (!cc.semesterId) return; // skip assertion if no semester on fixture
		const filtered = await admin.timetable.list({
			classCourseId: cc.id,
			semesterId: cc.semesterId,
		});
		expect(filtered.length).toBe(1);
		expect(filtered[0].id).toBe(s1.id);
	});

	it("deletes a session", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		const { session } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "fri",
			startTime: "14:00",
			endTime: "16:00",
		});

		await admin.timetable.delete({ id: session.id });

		const sessions = await admin.timetable.list({ classCourseId: cc.id });
		expect(sessions.some((s) => s.id === session.id)).toBe(false);
	});
});

// ── Room rejection (JVL-45) ──────────────────────────────────────────────────

describe("room validation", () => {
	it("rejects create with an inactive room", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);
		const room = await createRoom({ isActive: false });

		await expect(
			admin.timetable.create({
				classCourseId: cc.id,
				academicYearId,
				dayOfWeek: "mon",
				startTime: "08:00",
				endTime: "10:00",
				roomId: room.id,
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});

	it("rejects create with a roomId that does not belong to this institution", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		await expect(
			admin.timetable.create({
				classCourseId: cc.id,
				academicYearId,
				dayOfWeek: "mon",
				startTime: "08:00",
				endTime: "10:00",
				roomId: randomUUID(), // random ID — not in this institution
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});

// ── Conflict scoping by semester (JVL-47) ────────────────────────────────────

describe("conflict detection semester scoping", () => {
	it("sessions in different semesters do not conflict with each other", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		const cc2 = await createClassCourse({ class: cc1.class });
		const academicYearId = await getAcademicYear(cc1.id);

		const [sem1] = await db
			.insert(schema.semesters)
			.values({
				code: `S1-${randomUUID().slice(0, 6)}`,
				name: "Sem 1",
				orderIndex: 10,
			})
			.returning();
		const [sem2] = await db
			.insert(schema.semesters)
			.values({
				code: `S2-${randomUUID().slice(0, 6)}`,
				name: "Sem 2",
				orderIndex: 11,
			})
			.returning();

		// Create session in semester 1
		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
			semesterId: sem1.id,
		});

		// Same time + same class course group but in semester 2 → should NOT conflict
		const { session: s2 } = await admin.timetable.create({
			classCourseId: cc2.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
			semesterId: sem2.id,
		});
		expect(s2.id).toBeDefined();
	});

	it("JVL-47 regression: annual session (no semesterId) conflicts with semester-scoped session in same slot", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		const cc2 = await createClassCourse({ class: cc1.class });
		const room = await createRoom();
		const academicYearId = await getAcademicYear(cc1.id);

		// Annual session (no semesterId) occupies the room on Thursday 14:00–16:00
		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "thu",
			startTime: "14:00",
			endTime: "16:00",
			roomId: room.id,
		});

		const [sem] = await db
			.insert(schema.semesters)
			.values({
				code: `S-${randomUUID().slice(0, 6)}`,
				name: "Sem",
				orderIndex: 30,
			})
			.returning();

		// Semester-scoped session in the same room/slot → must CONFLICT with the annual one
		await expect(
			admin.timetable.create({
				classCourseId: cc2.id,
				academicYearId,
				dayOfWeek: "thu",
				startTime: "14:30",
				endTime: "15:30",
				roomId: room.id,
				semesterId: sem.id,
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});
});

// ── Bulk import (JVL-49) ─────────────────────────────────────────────────────

describe("bulk import", () => {
	it("preview detects duplicate within same batch (intra-batch conflict)", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();

		const { valid, errors } = await admin.timetable.previewBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "wed",
					startTime: "10:00",
					endTime: "12:00",
				},
				{
					classCourseId: cc.id,
					dayOfWeek: "wed",
					startTime: "10:00",
					endTime: "12:00",
				},
			],
		});
		expect(valid.length).toBe(1);
		expect(errors.length).toBe(1);
		expect(errors[0].reason).toContain("row 1");
	});

	it("execute persists semesterId on imported sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();

		const [sem] = await db
			.insert(schema.semesters)
			.values({
				code: `S-${randomUUID().slice(0, 6)}`,
				name: "Test Sem",
				orderIndex: 12,
			})
			.returning();

		await admin.timetable.executeBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "thu",
					startTime: "14:00",
					endTime: "16:00",
					semesterId: sem.id,
				},
			],
			skipDuplicates: true,
		});

		const sessions = await admin.timetable.list({
			classCourseId: cc.id,
			semesterId: sem.id,
		});
		expect(sessions.length).toBeGreaterThanOrEqual(1);
		expect(sessions[0].semesterId).toBe(sem.id);
	});
});

// ── Duplicate detection scoping by academic year + semester (JVL-49) ─────────

describe("findDuplicate scoping (JVL-49)", () => {
	it("same slot in different semester is not flagged as duplicate", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();

		const [sem1] = await db
			.insert(schema.semesters)
			.values({
				code: `S1-${randomUUID().slice(0, 6)}`,
				name: "Sem 1",
				orderIndex: 40,
			})
			.returning();
		const [sem2] = await db
			.insert(schema.semesters)
			.values({
				code: `S2-${randomUUID().slice(0, 6)}`,
				name: "Sem 2",
				orderIndex: 41,
			})
			.returning();

		// Import session in semester 1
		await admin.timetable.executeBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "fri",
					startTime: "08:00",
					endTime: "10:00",
					semesterId: sem1.id,
				},
			],
			skipDuplicates: false,
		});

		// Same slot but semester 2 — must NOT be detected as a duplicate
		const { valid, errors } = await admin.timetable.previewBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "fri",
					startTime: "08:00",
					endTime: "10:00",
					semesterId: sem2.id,
				},
			],
		});
		expect(valid.length).toBe(1);
		expect(errors.length).toBe(0);
	});

	it("same slot in same semester is detected as duplicate", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();

		const [sem] = await db
			.insert(schema.semesters)
			.values({
				code: `S-${randomUUID().slice(0, 6)}`,
				name: "Sem",
				orderIndex: 42,
			})
			.returning();

		await admin.timetable.executeBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "sat",
					startTime: "09:00",
					endTime: "11:00",
					semesterId: sem.id,
				},
			],
			skipDuplicates: false,
		});

		const { valid, errors } = await admin.timetable.previewBulkImport({
			rows: [
				{
					classCourseId: cc.id,
					dayOfWeek: "sat",
					startTime: "09:00",
					endTime: "11:00",
					semesterId: sem.id,
				},
			],
		});
		expect(valid.length).toBe(0);
		expect(errors.length).toBe(1);
		expect(errors[0].reason).toContain("Duplicate");
	});
});

// ── Conflict matrix (JVL-47) ─────────────────────────────────────────────────

describe("conflict matrix", () => {
	it("room double-booking is blocked", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		const cc2 = await createClassCourse();
		const room = await createRoom();
		const academicYearId = await getAcademicYear(cc1.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "10:00",
			roomId: room.id,
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc2.id,
				academicYearId,
				dayOfWeek: "mon",
				startTime: "08:30",
				endTime: "10:30",
				roomId: room.id,
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("class double-booking with different teachers is blocked", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		// Different teacher, same class
		const cc2 = await createClassCourse({ class: cc1.class });
		const academicYearId = await getAcademicYear(cc1.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "tue",
			startTime: "10:00",
			endTime: "12:00",
		});

		await expect(
			admin.timetable.create({
				classCourseId: cc2.id,
				academicYearId,
				dayOfWeek: "tue",
				startTime: "10:00",
				endTime: "12:00",
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("adjacent non-overlapping sessions do not conflict", async () => {
		const admin = createCaller(asAdmin());
		const cc1 = await createClassCourse();
		const cc2 = await createClassCourse({ teacher: cc1.teacher });
		const academicYearId = await getAcademicYear(cc1.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "thu",
			startTime: "08:00",
			endTime: "10:00",
		});

		// Starts exactly when first ends — should NOT conflict
		const { session } = await admin.timetable.create({
			classCourseId: cc2.id,
			academicYearId,
			dayOfWeek: "thu",
			startTime: "10:00",
			endTime: "12:00",
		});
		expect(session.id).toBeDefined();
	});

	it("update does not conflict with itself", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		const { session } = await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "fri",
			startTime: "14:00",
			endTime: "16:00",
		});

		// Updating to exactly the same time should not trigger a self-conflict
		const { session: updated } = await admin.timetable.update({
			id: session.id,
			startTime: "14:00",
			endTime: "16:00",
		});
		expect(updated.id).toBe(session.id);
	});
});

// ── Teacher / student timetable authorization (JVL-48) ───────────────────────

describe("myTeacherTimetable scoping", () => {
	it("teacher sees only their own sessions, not another teacher's", async () => {
		const admin = createCaller(asAdmin());
		const teacher1 = await createDomainUser();
		const cc1 = await createClassCourse({ teacher: teacher1.id });
		const academicYearId = await getAcademicYear(cc1.id);

		await admin.timetable.create({
			classCourseId: cc1.id,
			academicYearId,
			dayOfWeek: "mon",
			startTime: "08:00",
			endTime: "09:00",
		});

		const teacher2 = await createDomainUser();
		const callerT2 = createCaller(
			makeTestContext({
				role: "teacher",
				profileOverrides: { id: teacher2.id },
			}),
		);
		const sessions = await callerT2.timetable.myTeacherTimetable({});
		const ids = sessions.map((s) => s.classCourseId);
		expect(ids).not.toContain(cc1.id);
	});

	it("generic timetable.list is forbidden for teacher role", async () => {
		const caller = createCaller(makeTestContext({ role: "teacher" }));
		await expect(caller.timetable.list({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});
});

describe("myStudentTimetable scoping", () => {
	it("student sees only sessions for their enrolled courses", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "wed",
			startTime: "10:00",
			endTime: "12:00",
		});

		// Student enrolled in cc
		const student = await createStudent({ institutionId: cc.institutionId });
		await ensureStudentCourseEnrollment(student.id, cc.id, "active");

		const callerStudent = createCaller(
			makeTestContext({
				role: "student",
				profileOverrides: { id: student.domainUserId },
			}),
		);
		const sessions = await callerStudent.timetable.myStudentTimetable({});
		expect(sessions.some((s) => s.classCourseId === cc.id)).toBe(true);
	});

	it("student not enrolled in a course does not see its sessions", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const academicYearId = await getAcademicYear(cc.id);

		await admin.timetable.create({
			classCourseId: cc.id,
			academicYearId,
			dayOfWeek: "wed",
			startTime: "13:00",
			endTime: "15:00",
		});

		// A different student not enrolled in cc
		const otherStudent = await createStudent({
			institutionId: cc.institutionId,
		});
		// No enrollment for cc

		const callerStudent = createCaller(
			makeTestContext({
				role: "student",
				profileOverrides: { id: otherStudent.domainUserId },
			}),
		);
		const sessions = await callerStudent.timetable.myStudentTimetable({});
		expect(sessions.every((s) => s.classCourseId !== cc.id)).toBe(true);
	});
});
