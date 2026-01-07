import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import type { Context } from "@/lib/context";
import * as schema from "@/db/schema/app-schema";
import {
	asAdmin,
	createClass,
	createClassCourse,
	createCourse,
	createProgram,
	createRecapFixture,
	createStudent,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("studentCourseEnrollments router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(
			caller.studentCourseEnrollments.list({}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("creates enrollments and lists them", async () => {
		const admin = createCaller(asAdmin());
		const { student, klass, program, teachingUnit } =
			await createRecapFixture();
		const secondCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		const secondClassCourse = await createClassCourse({
			class: klass.id,
			course: secondCourse.id,
		});
		const result = await admin.studentCourseEnrollments.create({
			studentId: student.id,
			classCourseId: secondClassCourse.id,
			status: "active",
		});
		expect(result.record.studentId).toBe(student.id);
		expect(result.warnings).toHaveLength(0);
		const list = await admin.studentCourseEnrollments.list({
			studentId: student.id,
		});
		expect(list.items.length).toBeGreaterThanOrEqual(2);
	});

	it("prevents enrolling into a different program", async () => {
		const admin = createCaller(asAdmin());
		const { student } = await createRecapFixture();
		const otherProgram = await createProgram();
		const teachingUnit = await createTeachingUnit({
			programId: otherProgram.id,
		});
		const course = await createCourse({
			program: otherProgram.id,
			teachingUnitId: teachingUnit.id,
		});
		const klass = await createClass({
			program: otherProgram.id,
		});
		const classCourse = await createClassCourse({
			class: klass.id,
			course: course.id,
		});
		await expect(
			admin.studentCourseEnrollments.create({
				studentId: student.id,
				classCourseId: classCourse.id,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("bulk enrolls and reports conflicts", async () => {
		const admin = createCaller(asAdmin());
		const { student, klass, program, teachingUnit, classCourse } =
			await createRecapFixture();
		const extraCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		const extraClassCourse = await createClassCourse({
			class: klass.id,
			course: extraCourse.id,
		});
		const result = await admin.studentCourseEnrollments.bulkEnroll({
			studentId: student.id,
			classCourseIds: [classCourse.id, extraClassCourse.id],
		});
		expect(result.created.length).toBe(1);
		expect(result.created[0].warnings).toHaveLength(0);
		expect(result.skipped.length).toBe(1);
	});

	it("auto enrolls an entire class", async () => {
		const admin = createCaller(asAdmin());
		const { klass, academicYear, program, teachingUnit, classCourse } =
			await createRecapFixture();
		const secondCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		const secondClassCourse = await createClassCourse({
			class: klass.id,
			course: secondCourse.id,
		});
		const newStudent = await createStudent({ class: klass.id });
		const result = await admin.studentCourseEnrollments.autoEnrollClass({
			classId: klass.id,
			academicYearId: academicYear.id,
		});
		expect(result.studentsCount).toBeGreaterThanOrEqual(2);
		expect(result.classCoursesCount).toBeGreaterThanOrEqual(2);
		expect(result.createdCount).toBeGreaterThan(0);
		expect(result.warnings.length).toBeGreaterThanOrEqual(0);
		const roster = await admin.studentCourseEnrollments.list({
			studentId: newStudent.id,
		});
		const courseIds = roster.items.map((item) => item.classCourseId);
		expect(courseIds).toContain(classCourse.id);
		expect(courseIds).toContain(secondClassCourse.id);
	});

	it("includes warnings when mandatory prerequisites are missing", async () => {
		const admin = createCaller(asAdmin());
		const { classCourse, program, teachingUnit, klass } =
			await createRecapFixture();
		const student = await createStudent({ class: klass.id });
		const prereqCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		await db.insert(schema.coursePrerequisites).values({
			courseId: classCourse.course,
			prerequisiteCourseId: prereqCourse.id,
			type: "mandatory",
		});
		const result = await admin.studentCourseEnrollments.create({
			studentId: student.id,
			classCourseId: classCourse.id,
			status: "active",
		});
		expect(result.record.studentId).toBe(student.id);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toMatchObject({
			prerequisiteCourseId: prereqCourse.id,
			prerequisiteType: "mandatory",
			state: "missing",
		});
	});

	it("returns recommended prereq warnings during bulk enrollment", async () => {
		const admin = createCaller(asAdmin());
		const { classCourse, program, teachingUnit, klass } =
			await createRecapFixture();
		const student = await createStudent({ class: klass.id });
		const recommendedCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		await db.insert(schema.coursePrerequisites).values({
			courseId: classCourse.course,
			prerequisiteCourseId: recommendedCourse.id,
			type: "recommended",
		});
		const result = await admin.studentCourseEnrollments.bulkEnroll({
			studentId: student.id,
			classCourseIds: [classCourse.id],
		});
		expect(result.created).toHaveLength(1);
		expect(result.created[0].warnings).toHaveLength(1);
		expect(result.created[0].warnings[0]).toMatchObject({
			prerequisiteCourseId: recommendedCourse.id,
			prerequisiteType: "recommended",
			state: "missing",
		});
	});

	it("flags in-progress prerequisites during auto enrollment", async () => {
		const admin = createCaller(asAdmin());
		const { klass, academicYear, program, teachingUnit, classCourse } =
			await createRecapFixture();
		const prereqCourse = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		const prereqClassCourse = await createClassCourse({
			class: klass.id,
			course: prereqCourse.id,
		});
		await db.insert(schema.coursePrerequisites).values({
			courseId: classCourse.course,
			prerequisiteCourseId: prereqCourse.id,
			type: "mandatory",
		});
		const newStudent = await createStudent({ class: klass.id });
		await ensureStudentCourseEnrollment(
			newStudent.id,
			prereqClassCourse.id,
			"active",
		);
		const result = await admin.studentCourseEnrollments.autoEnrollClass({
			classId: klass.id,
			academicYearId: academicYear.id,
		});
		const hasInProgress = result.warnings.some(
			(warning) =>
				warning.prerequisiteCourseId === prereqCourse.id &&
				warning.state === "in-progress",
		);
		expect(hasInProgress).toBe(true);
	});
});
