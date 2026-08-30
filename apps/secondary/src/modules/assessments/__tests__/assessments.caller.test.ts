import { beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let studentId: string;
let classId: string;
let subjectId: string;
let termId: string;

beforeAll(async () => {
	await setupTestInstitution();
	const admin = appRouter.createCaller(asAdmin());

	// Create academic year
	const year = await admin.academicYears.create({
		name: `assessments-test-${Date.now()}`,
		startDate: new Date("2025-09-01"),
		endDate: new Date("2026-06-30"),
	});

	// Create track and class
	const track = await admin.tracks.create({
		name: "Test Track",
		code: `TR-${Date.now()}`,
		cycleLevel: "second_cycle",
	});

	const classRes = await admin.classes.create({
		name: "Form 1A",
		code: `FORM-${Date.now()}`,
		level: "Tle",
		academicYearId: year.id,
		trackId: track.id,
	});
	classId = classRes.id;

	// Create subject
	const subject = await admin.subjects.create({
		name: "Mathematics",
		nameFr: "Mathematiques",
		code: `MATH-${Date.now()}`,
	});
	subjectId = subject.id;

	// Create terms
	const t1 = await admin.terms.create({
		academicYearId: year.id,
		termNumber: 1,
		startDate: new Date("2025-09-08"),
		endDate: new Date("2025-11-28"),
	});
	termId = t1.id;

	// Create student
	const student = await admin.students.create({
		firstName: "Test",
		lastName: "Grader",
	});
	studentId = student.id;

	// Enroll student in class
	await admin.enrollments.create({
		studentId,
		academicYearId: year.id,
		classId,
	});
});

describe("assessments.upsert", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.assessments.upsert({
				studentId: "00000000-0000-0000-0000-000000000000",
				classId: "00000000-0000-0000-0000-000000000000",
				subjectId: "00000000-0000-0000-0000-000000000000",
				termId: "00000000-0000-0000-0000-000000000000",
				assessmentType: "sequence_1",
				value: 15,
			}),
		).rejects.toBeDefined();
	});

	it("creates a new assessment", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.assessments.upsert({
			studentId,
			classId,
			subjectId,
			termId,
			assessmentType: "sequence_1",
			value: 15,
		});
		expect(result.id).toBeString();
		expect(result.value).toBe("15.00");
	});

	it("updates existing assessment (upsert)", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const first = await caller.assessments.upsert({
			studentId,
			classId,
			subjectId,
			termId,
			assessmentType: "sequence_2",
			value: 12,
		});
		const second = await caller.assessments.upsert({
			studentId,
			classId,
			subjectId,
			termId,
			assessmentType: "sequence_2",
			value: 14,
		});
		expect(second.id).toBe(first.id);
		expect(second.value).toBe("14.00");
	});

	it("accepts null value (absent student)", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.assessments.upsert({
			studentId,
			classId,
			subjectId,
			termId,
			assessmentType: "sequence_3",
			value: null,
		});
		expect(result.value).toBeNull();
	});
});

describe("assessments.listForClass", () => {
	it("returns assessments for a class", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const results = await caller.assessments.listForClass({
			classId,
			subjectId,
			termId,
		});
		expect(Array.isArray(results)).toBe(true);
	});
});

describe("assessments.getStudentResults", () => {
	it("returns assessments for a student in a term", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const results = await caller.assessments.getStudentResults({
			studentId,
			termId,
		});
		expect(Array.isArray(results)).toBe(true);
	});

	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.assessments.getStudentResults({
				studentId: "00000000-0000-0000-0000-000000000000",
				termId: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toBeDefined();
	});
});

describe("assessments.batchUpsert", () => {
	it("batch inserts multiple assessments", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const results = await caller.assessments.batchUpsert({
			items: [
				{
					studentId,
					classId,
					subjectId,
					termId,
					assessmentType: "sequence_4",
					value: 18,
				},
				{
					studentId,
					classId,
					subjectId,
					termId,
					assessmentType: "sequence_5",
					value: 16,
				},
			],
		});
		expect(results).toHaveLength(2);
		expect(results[0]?.value).toBe("18.00");
		expect(results[1]?.value).toBe("16.00");
	});
});
