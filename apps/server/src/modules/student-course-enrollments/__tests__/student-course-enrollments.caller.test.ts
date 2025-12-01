import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createClass,
	createClassCourse,
	createCourse,
	createProgram,
	createRecapFixture,
	createTeachingUnit,
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
		const record = await admin.studentCourseEnrollments.create({
			studentId: student.id,
			classCourseId: secondClassCourse.id,
			status: "active",
		});
		expect(record.studentId).toBe(student.id);
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
		expect(result.skipped.length).toBe(1);
	});
});
