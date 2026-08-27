import { beforeAll, describe, expect, it } from "bun:test";
import { db } from "../../../db";
import {
	academicYears,
	assessments,
	classes,
	enrollments,
	staff,
	students,
	subjects,
	terms,
} from "../../../db/schema";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let institutionId: string;
let academicYearId: string;
let termId: string;
let classId: string;
let studentId: string;
let enrollmentId: string;
let subjectId: string;
let staffId: string;

beforeAll(async () => {
	const institution = await setupTestInstitution();
	institutionId = institution.id;

	// Create an academic year
	const admin = appRouter.createCaller(asAdmin());
	const year = await admin.academicYears.create({
		name: `report-cards-test-${Date.now()}`,
		startDate: new Date("2025-09-01"),
		endDate: new Date("2026-06-30"),
	});
	academicYearId = year.id;

	// Create a class
	const cls = await admin.classes.create({
		name: "Test Class",
		code: `TEST-${Date.now()}`,
		level: "3e",
		academicYearId,
	});
	classId = cls.id;

	// Create a subject
	const subject = await admin.subjects.create({
		name: "Mathematics",
		nameFr: "Mathématiques",
		code: `MATH-${Date.now()}`,
		subjectGroup: "sciences",
	});
	subjectId = subject.id;

	// Create a term
	const [term] = await db
		.insert(terms)
		.values({
			institutionId,
			academicYearId,
			termNumber: 1,
			startDate: new Date("2025-09-01"),
			endDate: new Date("2025-10-31"),
		})
		.returning();
	termId = term!.id;

	// Create a student
	const [student] = await db
		.insert(students)
		.values({
			institutionId,
			firstName: "John",
			lastName: "Doe",
		})
		.returning();
	studentId = student!.id;

	// Enroll the student in the class
	const [enrollment] = await db
		.insert(enrollments)
		.values({
			institutionId,
			studentId,
			academicYearId,
			classId,
		})
		.returning();
	enrollmentId = enrollment!.id;

	// Create a staff member
	const [staffMember] = await db
		.insert(staff)
		.values({
			institutionId,
			firstName: "Jane",
			lastName: "Smith",
			email: `teacher-${Date.now()}@test.com`,
		})
		.returning();
	staffId = staffMember!.id;

	// Create some assessments for the student
	await db.insert(assessments).values({
		institutionId,
		studentId,
		classId,
		subjectId,
		termId,
		assessmentType: "sequence_1",
		value: "15.50",
		enteredById: staffId,
	});

	await db.insert(assessments).values({
		institutionId,
		studentId,
		classId,
		subjectId,
		termId,
		assessmentType: "sequence_2",
		value: "14.00",
		enteredById: staffId,
	});
});

describe("reportCards.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.reportCards.list({ academicYearId }),
		).rejects.toBeDefined();
	});

	it("returns paginated result initially", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.reportCards.list({ academicYearId });
		expect(Array.isArray(result.items)).toBe(true);
		expect(typeof result.total).toBe("number");
	});

	it("filters by term when provided", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.reportCards.list({
			academicYearId,
			termId,
		});
		expect(Array.isArray(result.items)).toBe(true);
	});

	it("filters by class when provided", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.reportCards.list({
			academicYearId,
			classId,
		});
		expect(Array.isArray(result.items)).toBe(true);
	});
});

describe("reportCards.get", () => {
	it("throws NOT_FOUND for non-existent report card", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.reportCards.get({ id: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("reportCards.generate", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.reportCards.generate({ studentId, termId }),
		).rejects.toBeDefined();
	});

	it("generates a report card with subject averages", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const card = await caller.reportCards.generate({ studentId, termId });

		expect(card.id).toBeString();
		expect(card.enrollmentId).toBe(enrollmentId);
		expect(card.termId).toBe(termId);
		expect(card.status).toBe("generated");
		expect(card.snapshotData).toBeDefined();

		const data = card.snapshotData as Record<string, unknown> & {
			subjectAverages: Record<string, unknown>;
		};
		expect(data.studentId).toBe(studentId);
		expect(data.overallAverage).toBe(14.75); // (15.5 + 14) / 2
		expect(Object.keys(data.subjectAverages)).toContain(subjectId);
	});

	it("throws NOT_FOUND if student is not enrolled", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const fakeStudentId = "00000000-0000-0000-0000-000000000000";
		await expect(
			caller.reportCards.generate({ studentId: fakeStudentId, termId }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
