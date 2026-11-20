import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createCourse,
	createExamType,
	createProgram,
	createStudent,
	createTeachingUnit,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/**
 * A class created from scratch the way an admin does it in the UI: students
 * enrolled in the class, then a teaching unit's courses added with
 * classCourses.create. Nobody runs "enroll the whole class" in between.
 */
async function newClassWithCourses(opts: { students: number }) {
	const admin = appRouter.createCaller(asAdmin());
	const academicYear = await createAcademicYear();
	const program = await createProgram();
	const unit = await createTeachingUnit({ programId: program.id });
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
	});
	for (let i = 0; i < opts.students; i += 1) {
		await createStudent({ class: klass.id });
	}
	const courses = [
		await createCourse({ program: program.id, teachingUnitId: unit.id }),
		await createCourse({ program: program.id, teachingUnitId: unit.id }),
		await createCourse({ program: program.id, teachingUnitId: unit.id }),
	];
	const classCourses = [];
	for (const course of courses) {
		classCourses.push(
			await admin.classCourses.create({
				code: `EXX-${randomUUID().slice(0, 6)}`,
				class: klass.id,
				course: course.id,
				teacher: course.defaultTeacher ?? "",
				coefficient: 1,
			}),
		);
	}
	const examType = await createExamType({ name: `CC ${randomUUID()}` });
	return { admin, academicYear, program, unit, klass, classCourses, examType };
}

describe("exam scheduling for a newly created class", () => {
	it("creates one exam per course of a class whose students were enrolled before its courses", async () => {
		const f = await newClassWithCourses({ students: 6 });
		const result = await f.admin.examScheduler.schedule({
			academicYearId: f.academicYear.id,
			examTypeId: f.examType.id,
			percentage: 30,
			dateStart: new Date("2026-01-10"),
			dateEnd: new Date("2026-01-20"),
			classIds: [f.klass.id],
		});
		expect(result.conflicts).toBe(0);
		expect(result.conflictDetails).toEqual([]);
		expect(result.created).toBe(3);

		// Every student of the class is on each course's roster
		for (const cc of f.classCourses) {
			const roster = await db.query.studentCourseEnrollments.findMany({
				where: and(
					eq(schema.studentCourseEnrollments.classCourseId, cc.id),
					eq(schema.studentCourseEnrollments.status, "active"),
				),
			});
			expect(roster.length).toBe(6);
		}
	});

	it("lets an admin add an exam on a new class course by hand", async () => {
		const f = await newClassWithCourses({ students: 2 });
		const exam = await f.admin.exams.create({
			name: "EXX CC",
			type: "CC",
			date: new Date("2026-01-12"),
			percentage: 30,
			classCourseId: f.classCourses[0].id,
		});
		expect(exam.id).toBeTruthy();
	});

	it("explains each conflict: which course and why", async () => {
		const f = await newClassWithCourses({ students: 0 });
		const result = await f.admin.examScheduler.schedule({
			academicYearId: f.academicYear.id,
			examTypeId: f.examType.id,
			percentage: 30,
			dateStart: new Date("2026-01-10"),
			dateEnd: new Date("2026-01-20"),
			classIds: [f.klass.id],
		});
		expect(result.created).toBe(0);
		expect(result.conflicts).toBe(3);
		expect(result.conflictDetails).toHaveLength(3);
		for (const detail of result.conflictDetails) {
			expect(detail.reason).toBe("noStudents");
			expect(detail.className).toBe(f.klass.name);
			expect(detail.courseName).toBeTruthy();
		}
	});

	it("reports a course whose weights already reach 100%", async () => {
		const f = await newClassWithCourses({ students: 1 });
		await f.admin.exams.create({
			name: "EXX Final",
			type: "Final",
			date: new Date("2026-01-12"),
			percentage: 80,
			classCourseId: f.classCourses[0].id,
		});
		const result = await f.admin.examScheduler.schedule({
			academicYearId: f.academicYear.id,
			examTypeId: f.examType.id,
			percentage: 30,
			dateStart: new Date("2026-01-10"),
			dateEnd: new Date("2026-01-20"),
			classIds: [f.klass.id],
		});
		expect(result.created).toBe(2);
		expect(result.conflictDetails).toHaveLength(1);
		expect(result.conflictDetails[0]).toMatchObject({
			classCourseId: f.classCourses[0].id,
			reason: "percentageExceeded",
			currentPercentage: 80,
		});
	});
});

describe("scheduler history", () => {
	it("lists the latest run first", async () => {
		const f = await newClassWithCourses({ students: 1 });
		const run = (percentage: number) =>
			f.admin.examScheduler.schedule({
				academicYearId: f.academicYear.id,
				examTypeId: f.examType.id,
				percentage,
				dateStart: new Date("2026-01-10"),
				dateEnd: new Date("2026-01-20"),
				classIds: [f.klass.id],
			});
		const first = await run(30);
		const second = await run(30);
		const history = await f.admin.examScheduler.history({});
		expect(history.items.map((item) => item.id as string | undefined)).toEqual([
			second.runId,
			first.runId,
		]);
	});
});

describe("enrolling a student in a class", () => {
	it("enrolls the student in the class's courses", async () => {
		const f = await newClassWithCourses({ students: 0 });
		const student = await f.admin.students.create({
			classId: f.klass.id,
			registrationNumber: `EXX-${randomUUID().slice(0, 8)}`,
			firstName: "EXX",
			lastName: "Student",
			email: `exx-${randomUUID()}@example.com`,
			dateOfBirth: new Date("2004-01-01"),
			placeOfBirth: "Douala",
			gender: "female",
		});
		const roster = await db.query.studentCourseEnrollments.findMany({
			where: eq(schema.studentCourseEnrollments.studentId, student.id),
		});
		expect(roster.map((r) => r.classCourseId).sort()).toEqual(
			f.classCourses.map((cc) => cc.id).sort(),
		);
	});
});

describe("searching class courses for the exam form", () => {
	it("lists the year's class courses with course and class names", async () => {
		const f = await newClassWithCourses({ students: 0 });
		const items = await f.admin.classCourses.search({
			query: "",
			academicYearId: f.academicYear.id,
			limit: 50,
		});
		expect(items.map((i) => i.id).sort()).toEqual(
			f.classCourses.map((cc) => cc.id).sort(),
		);
		expect(items.every((i) => i.courseName && i.className)).toBe(true);
		// The course assignments list searches the same way, paged
		const paged = await f.admin.classCourses.listPaged({
			page: 1,
			pageSize: 25,
			query: f.klass.name,
		});
		expect(paged.total).toBe(3);
		const other = await createAcademicYear();
		const none = await f.admin.classCourses.search({
			query: "",
			academicYearId: other.id,
		});
		expect(none).toEqual([]);
	});
});

describe("adding a teaching unit's courses to a class", () => {
	it("adds a course without a default teacher, flagged as having no teacher", async () => {
		const admin = appRouter.createCaller(asAdmin());
		const academicYear = await createAcademicYear();
		const program = await createProgram();
		const unit = await createTeachingUnit({ programId: program.id });
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
		});
		const course = await createCourse({
			program: program.id,
			teachingUnitId: unit.id,
		});
		await db
			.update(schema.courses)
			.set({ defaultTeacher: null })
			.where(eq(schema.courses.id, course.id));

		const created = await admin.classCourses.create({
			code: `EXX-${randomUUID().slice(0, 6)}`,
			class: klass.id,
			course: course.id,
			coefficient: 1,
		});
		expect(created.id).toBeTruthy();
		const row = await admin.classCourses.getById({ id: created.id });
		expect(row.hasTeacher).toBe(false);
	});
});
