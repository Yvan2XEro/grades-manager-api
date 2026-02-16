import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createExamType,
	createProgram,
	createStudent,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

async function bootstrapFixtures() {
	const academicYear = await createAcademicYear();
	const program = await createProgram();
	const teachingUnit = await createTeachingUnit({ programId: program.id });
	const courseA = await createCourse({
		program: program.id,
		teachingUnitId: teachingUnit.id,
	});
	const courseB = await createCourse({
		program: program.id,
		teachingUnitId: teachingUnit.id,
	});
	const classOne = await createClass({
		program: program.id,
		academicYear: academicYear.id,
	});
	const classTwo = await createClass({
		program: program.id,
		academicYear: academicYear.id,
	});
	const classCourses = [
		await createClassCourse({ class: classOne.id, course: courseA.id }),
		await createClassCourse({ class: classTwo.id, course: courseB.id }),
	];
	for (const classCourse of classCourses) {
		const student = await createStudent({ class: classCourse.class });
		await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
	}
	const examType = await createExamType({
		name: `Session normale ${randomUUID()}`,
	});
	const semesterId = classOne.semesterId ?? classTwo.semesterId;
	if (!semesterId) {
		throw new Error("Missing semester for fixtures");
	}
	return {
		institutionId: program.institutionId,
		academicYear,
		program,
		courses: [courseA, courseB],
		classes: [classOne, classTwo],
		classCourses,
		examType,
		semesterId,
	};
}

describe("exam scheduler router", () => {
	it("requires admin privileges", async () => {
		const { institutionId, academicYear, examType } = await bootstrapFixtures();
		const unauthenticated = createCaller(makeTestContext());
		await expect(
			unauthenticated.examScheduler.preview({
				institutionId: institutionId,
				academicYearId: academicYear.id,
			}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");

		const student = createCaller(makeTestContext({ role: "student" }));
		await expect(
			student.examScheduler.schedule({
				institutionId: institutionId,
				academicYearId: academicYear.id,
				examTypeId: examType.id,
				percentage: 30,
				dateStart: new Date(),
				dateEnd: new Date(),
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
		await expect(student.examScheduler.history({})).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);
	});

	it("schedules exams across classes and avoids duplicates", async () => {
		const fixtures = await bootstrapFixtures();
		const admin = createCaller(asAdmin());
		const preview = await admin.examScheduler.preview({
			institutionId: fixtures.institutionId,
			academicYearId: fixtures.academicYear.id,
			semesterId: fixtures.semesterId,
		});
		expect(preview.classes.length).toBe(2);
		expect(preview.classes.every((klass) => klass.classCourseCount === 1)).toBe(
			true,
		);

		const firstRun = await admin.examScheduler.schedule({
			institutionId: fixtures.institutionId,
			academicYearId: fixtures.academicYear.id,
			examTypeId: fixtures.examType.id,
			percentage: 40,
			dateStart: new Date("2025-01-01"),
			dateEnd: new Date("2025-01-10"),
			semesterId: fixtures.semesterId,
		});
		expect(firstRun.created).toBe(fixtures.classCourses.length);
		expect(firstRun.examIds.length).toBe(fixtures.classCourses.length);
		expect(firstRun.duplicates).toBe(0);
		expect(firstRun.classCourseCount).toBe(fixtures.classCourses.length);
		expect(firstRun.runId).toBeTruthy();

		const secondRun = await admin.examScheduler.schedule({
			institutionId: fixtures.institutionId,
			academicYearId: fixtures.academicYear.id,
			examTypeId: fixtures.examType.id,
			percentage: 40,
			dateStart: new Date("2025-01-01"),
			dateEnd: new Date("2025-01-10"),
			semesterId: fixtures.semesterId,
		});
		expect(secondRun.created).toBe(0);
		expect(secondRun.duplicates).toBe(fixtures.classCourses.length);
		expect(secondRun.skipped).toBe(fixtures.classCourses.length);

		const history = await admin.examScheduler.history({});
		expect(history.items.length).toBeGreaterThan(0);
		const targetRun = history.items.find((item) => item.id === firstRun.runId);
		expect(targetRun).toBeTruthy();
		expect(Number(targetRun?.createdCount ?? 0)).toBe(
			fixtures.classCourses.length,
		);

		const details = await admin.examScheduler.details({
			runId: firstRun.runId ?? "",
		});
		expect(details.run.id).toBe(firstRun.runId);
		expect(details.exams.length).toBe(fixtures.classCourses.length);
	});

	it("supports limiting by selected classes", async () => {
		const fixtures = await bootstrapFixtures();
		const admin = createCaller(asAdmin());
		const targetClass = fixtures.classes[0];
		const subset = await admin.examScheduler.schedule({
			institutionId: fixtures.institutionId,
			academicYearId: fixtures.academicYear.id,
			examTypeId: fixtures.examType.id,
			percentage: 25,
			dateStart: new Date("2025-03-01"),
			dateEnd: new Date("2025-03-05"),
			semesterId: fixtures.semesterId,
			classIds: [targetClass.id],
		});
		expect(subset.created).toBe(1);
		expect(subset.classCount).toBe(1);
		expect(subset.classCourseCount).toBe(1);
	});
});
