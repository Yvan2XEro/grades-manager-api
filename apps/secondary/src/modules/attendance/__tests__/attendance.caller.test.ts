import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	asTeacher,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let institutionId: string;
let classId: string;
let termId: string;
let studentId: string;
let sessionId: string;

beforeAll(async () => {
	const institution = await setupTestInstitution();
	institutionId = institution.id;

	// Create test data
	const caller = appRouter.createCaller(asAdmin());

	// Create academic year
	const year = await caller.academicYears.create({
		name: "2025-2026",
		startDate: new Date("2025-09-01"),
		endDate: new Date("2026-06-30"),
	});

	// Create term
	const term = await caller.terms.create({
		academicYearId: year.id,
		termNumber: 1,
		startDate: new Date("2025-09-01"),
		endDate: new Date("2025-11-30"),
	});
	termId = term.id;

	// Create track
	const track = await caller.tracks.create({
		name: "Terminale C",
		code: "TLE-C",
		cycleLevel: "second_cycle",
	});

	// Create class
	const cls = await caller.classes.create({
		academicYearId: year.id,
		trackId: track.id,
		name: "Terminale C",
		code: "TLE-C",
		level: "Tle",
	});
	classId = cls.id;

	// Create student
	const student = await caller.students.create({
		firstName: "John",
		lastName: "Doe",
		gender: "M",
	});
	studentId = student.id;

	// Create enrollment
	await caller.enrollments.create({
		studentId: student.id,
		academicYearId: year.id,
		classId: cls.id,
	});

	// Create attendance session
	const session = await caller.attendance.createSession({
		classId: cls.id,
		termId: term.id,
		sessionDate: new Date("2025-10-01"),
		startTime: "08:00",
		endTime: "09:30",
	});
	sessionId = session.id;
});

describe("attendance.listSessions", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.attendance.listSessions({
				classId,
			}),
		).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("lists sessions for a class", async () => {
		const caller = appRouter.createCaller(asTeacher());
		const sessions = await caller.attendance.listSessions({
			classId,
		});
		expect(Array.isArray(sessions)).toBe(true);
		expect(sessions.length).toBeGreaterThanOrEqual(1);
		expect(sessions[0]?.classId).toBe(classId);
	});
});

describe("attendance.createSession", () => {
	it("rejects non-admin requests", async () => {
		const caller = appRouter.createCaller(asTeacher());
		await expect(
			caller.attendance.createSession({
				classId,
				termId,
				sessionDate: new Date("2025-10-02"),
			}),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("creates an attendance session and returns it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const session = await caller.attendance.createSession({
			classId,
			termId,
			sessionDate: new Date("2025-10-02"),
			startTime: "09:00",
			endTime: "10:30",
		});
		expect(session.id).toBeString();
		expect(session.classId).toBe(classId);
		expect(session.sessionDate).toBeTruthy();
	});
});

describe("attendance.recordAttendance", () => {
	it("rejects non-admin requests", async () => {
		const caller = appRouter.createCaller(asTeacher());
		await expect(
			caller.attendance.recordAttendance({
				sessionId,
				studentId,
				status: "present",
			}),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("records attendance for a student", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const record = await caller.attendance.recordAttendance({
			sessionId,
			studentId,
			status: "present",
			justification: "On time",
		});
		expect(record.id).toBeString();
		expect(record.status).toBe("present");
		expect(record.studentId).toBe(studentId);
	});

	it("updates existing attendance record (upsert)", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const record = await caller.attendance.recordAttendance({
			sessionId,
			studentId,
			status: "late",
			justification: "Traffic",
		});
		expect(record.status).toBe("late");
		expect(record.justification).toBe("Traffic");
	});
});

describe("attendance.getSessionRecords", () => {
	it("lists records for a session", async () => {
		const caller = appRouter.createCaller(asTeacher());
		const records = await caller.attendance.getSessionRecords({
			sessionId,
		});
		expect(Array.isArray(records)).toBe(true);
		expect(records.length).toBeGreaterThanOrEqual(1);
		expect(records[0]?.sessionId).toBe(sessionId);
	});
});

describe("attendance.studentHistory", () => {
	it("lists attendance history for a student", async () => {
		const caller = appRouter.createCaller(asTeacher());
		const history = await caller.attendance.studentHistory({
			studentId,
		});
		expect(Array.isArray(history)).toBe(true);
		expect(history.length).toBeGreaterThanOrEqual(1);
		expect(history[0]?.studentId).toBe(studentId);
	});

	it("filters by date range", async () => {
		const caller = appRouter.createCaller(asTeacher());
		const history = await caller.attendance.studentHistory({
			studentId,
			startDate: new Date("2025-10-01"),
			endDate: new Date("2025-10-31"),
		});
		expect(Array.isArray(history)).toBe(true);
	});
});
