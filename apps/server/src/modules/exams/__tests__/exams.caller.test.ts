import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createDomainUser,
	createFaculty,
	createProgram,
	createRecapFixture,
	createStudent,
	ensureStudentCourseEnrollment,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
describe("exams router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.exams.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("enforces percentage and lock", async () => {
		const admin = createCaller(asAdmin());
		const cc = await createClassCourse();
		const student = await createStudent({ class: cc.class });
		await ensureStudentCourseEnrollment(student.id, cc.id, "active");
		const exam = await admin.exams.create({
			name: "Mid",
			type: "WRITTEN",
			date: new Date(),
			percentage: 60,
			classCourseId: cc.id,
		});
		await expect(
			admin.exams.create({
				name: "Final",
				type: "WRITTEN",
				date: new Date(),
				percentage: 50,
				classCourseId: cc.id,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");

		if (!exam) {
			throw new Error("Failed to create exam");
		}
		await admin.exams.submit({ examId: exam.id });
		await admin.exams.validate({ examId: exam.id, status: "approved" });
		await admin.exams.lock({ examId: exam.id, lock: true });
		await expect(
			admin.exams.update({ id: exam.id, name: "M" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
		await expect(admin.exams.delete({ id: exam.id })).rejects.toHaveProperty(
			"code",
			"FORBIDDEN",
		);

		await expect(
			admin.grades.upsertNote({
				studentId: student.id,
				examId: exam.id,
				score: 80,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("requires active student roster before scheduling exams", async () => {
		const admin = createCaller(asAdmin());
		const { classCourse } = await createRecapFixture();
		await expect(
			admin.exams.create({
				name: "Roster Test",
				type: "TP",
				date: new Date(),
				percentage: 20,
				classCourseId: classCourse.id,
			}),
		).resolves.toBeTruthy();

		const lonelyClassCourse = await createClassCourse();
		await expect(
			admin.exams.create({
				name: "Invalid",
				type: "WRITTEN",
				date: new Date(),
				percentage: 20,
				classCourseId: lonelyClassCourse.id,
			}),
		).rejects.toHaveProperty("code", "BAD_REQUEST");
	});

	it("prevents managing exams from another institution", async () => {
		const admin = createCaller(asAdmin());
		const [foreignInstitution] = await db
			.insert(schema.institutions)
			.values({
				code: `OTH-${randomUUID().slice(0, 6)}`,
				shortName: "OTHER",
				nameFr: "Institution étrangère",
				nameEn: "Foreign Institution",
			})
			.returning();
		const faculty = await createFaculty({
			institutionId: foreignInstitution.id,
		});
		const program = await createProgram({
			institutionId: foreignInstitution.id,
		});
		const academicYear = await createAcademicYear({
			institutionId: foreignInstitution.id,
		});
		const klass = await createClass({
			program: program.id,
			academicYear: academicYear.id,
			institutionId: foreignInstitution.id,
		});
		const course = await createCourse({ program: program.id });
		const teacher = await createDomainUser();
		const [classCourse] = await db
			.insert(schema.classCourses)
			.values({
				code: `CC-${randomUUID().slice(0, 6)}`,
				class: klass.id,
				course: course.id,
				teacher: teacher.id,
				weeklyHours: 2,
				institutionId: foreignInstitution.id,
				semesterId: klass.semesterId,
			})
			.returning();
		await expect(
			admin.exams.create({
				name: "Foreign Exam",
				type: "WRITTEN",
				date: new Date(),
				percentage: 20,
				classCourseId: classCourse.id,
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
		const [exam] = await db
			.insert(schema.exams)
			.values({
				name: "External",
				type: "WRITTEN",
				date: new Date(),
				percentage: "20",
				classCourse: classCourse.id,
				institutionId: foreignInstitution.id,
				status: "draft",
				isLocked: false,
			})
			.returning();
		await expect(admin.exams.getById({ id: exam.id })).rejects.toHaveProperty(
			"code",
			"NOT_FOUND",
		);
	});

	it("filters exams by academic year, search, class, and semester", async () => {
		const admin = createCaller(asAdmin());
		const primary = await createRecapFixture();
		const secondaryYear = await createAcademicYear();
		const secondaryProgram = await createProgram();
		const secondaryClass = await createClass({
			program: secondaryProgram.id,
			academicYear: secondaryYear.id,
		});
		const secondaryCourse = await createCourse({
			program: secondaryProgram.id,
		});
		const secondaryClassCourse = await createClassCourse({
			class: secondaryClass.id,
			course: secondaryCourse.id,
		});
		const otherStudent = await createStudent({ class: secondaryClass.id });
		await ensureStudentCourseEnrollment(otherStudent.id, secondaryClassCourse.id, "active");
		await admin.exams.create({
			name: "Secondary Session",
			type: "WRITTEN",
			date: new Date(),
			percentage: 30,
			classCourseId: secondaryClassCourse.id,
		});

		const extraClass = await createClass({
			program: primary.program.id,
			academicYear: primary.klass.academicYear,
		});
		const extraCourse = await createCourse({
			program: primary.program.id,
		});
		const extraClassCourse = await createClassCourse({
			class: extraClass.id,
			course: extraCourse.id,
		});
		const extraStudent = await createStudent({ class: extraClass.id });
		await ensureStudentCourseEnrollment(extraStudent.id, extraClassCourse.id, "active");
		await admin.exams.create({
			name: "Extra Session",
			type: "LAB",
			date: new Date(),
			percentage: 10,
			classCourseId: extraClassCourse.id,
		});

		const searchResponse = await admin.exams.list({
			academicYearId: primary.klass.academicYear,
			query: primary.exam.name.slice(0, 3),
		});
		expect(
			searchResponse.items.every((item) => item.classCourse === primary.classCourse.id),
		).toBe(true);

		const secondaryResponse = await admin.exams.list({
			academicYearId: secondaryYear.id,
		});
		expect(
			secondaryResponse.items.every(
				(item) => item.classCourse === secondaryClassCourse.id,
			),
		).toBe(true);

		const classFiltered = await admin.exams.list({
			academicYearId: primary.klass.academicYear,
			classId: primary.klass.id,
		});
		expect(
			classFiltered.items.every(
				(item) => item.classId === primary.klass.id,
			),
		).toBe(true);

		const [customSemester] = await db
			.insert(schema.semesters)
			.values({
				code: `S-${randomUUID().slice(0, 4)}`,
				name: "Custom Semester",
				orderIndex: 99,
			})
			.returning();
		const semesterClass = await createClass({
			program: primary.program.id,
			academicYear: primary.klass.academicYear,
			semesterId: customSemester.id,
		});
		const semesterCourse = await createCourse({ program: primary.program.id });
		const semesterClassCourse = await createClassCourse({
			class: semesterClass.id,
			course: semesterCourse.id,
		});
		const semesterStudent = await createStudent({ class: semesterClass.id });
		await ensureStudentCourseEnrollment(
			semesterStudent.id,
			semesterClassCourse.id,
			"active",
		);
		await admin.exams.create({
			name: "Semester Session",
			type: "WRITTEN",
			date: new Date(),
			percentage: 15,
			classCourseId: semesterClassCourse.id,
		});

		const semesterFiltered = await admin.exams.list({
			academicYearId: primary.klass.academicYear,
			semesterId: customSemester.id,
		});
		expect(
			semesterFiltered.items.every(
				(item) => item.classId === semesterClass.id,
			),
		).toBe(true);
	});

	describe("retake eligibility endpoints", () => {
		const originalFlag = process.env.RETAKES_FEATURE_FLAG;
		beforeAll(() => {
			process.env.RETAKES_FEATURE_FLAG = "true";
		});

		afterAll(() => {
			process.env.RETAKES_FEATURE_FLAG = originalFlag;
		});

		it("short-circuits when feature flag disabled", async () => {
			process.env.RETAKES_FEATURE_FLAG = "false";
			const admin = createCaller(asAdmin());
			const response = await admin.exams.listRetakeEligibility({
				examId: randomUUID(),
			});
			expect(response).toEqual({ enabled: false, items: [] });
			process.env.RETAKES_FEATURE_FLAG = "true";
		});

		it("rejects eligibility listing when exam is not approved", async () => {
			const admin = createCaller(asAdmin());
			const classCourse = await createClassCourse();
			const student = await createStudent({ class: classCourse.class });
			await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
			const exam = await admin.exams.create({
				name: "Draft Exam",
				type: "WRITTEN",
				date: new Date(),
				percentage: 40,
				classCourseId: classCourse.id,
			});
			await expect(
				admin.exams.listRetakeEligibility({ examId: exam.id }),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("computes eligibility rows and applies overrides", async () => {
			const admin = createCaller(asAdmin());
			const fixture = await createRecapFixture({
				grade: { score: "8" },
			});
			const response = await admin.exams.listRetakeEligibility({
				examId: fixture.exam.id,
			});
			expect(response.enabled).toBe(true);
			expect(response.items).toHaveLength(1);
			const row = response.items[0];
			expect(row.status).toBe("eligible");
			expect(row.reasons).toContain("FAILED_EXAM");

			await admin.exams.upsertRetakeOverride({
				examId: fixture.exam.id,
				studentCourseEnrollmentId: row.studentCourseEnrollmentId,
				decision: "force_ineligible",
				reason: "jury decision",
			});
			const overridden = await admin.exams.listRetakeEligibility({
				examId: fixture.exam.id,
			});
			expect(overridden.items[0].status).toBe("ineligible");
			expect(overridden.items[0].override?.decision).toBe("force_ineligible");

			await admin.exams.deleteRetakeOverride({
				examId: fixture.exam.id,
				studentCourseEnrollmentId: row.studentCourseEnrollmentId,
			});
			const cleared = await admin.exams.listRetakeEligibility({
				examId: fixture.exam.id,
			});
			expect(cleared.items[0].status).toBe("eligible");
			expect(cleared.items[0].override).toBeUndefined();
		});

		it("enforces attempt limits while allowing overrides", async () => {
			const admin = createCaller(asAdmin());
			const fixture = await createRecapFixture({
				grade: { score: "9" },
			});
			const existingEnrollment =
				await db.query.studentCourseEnrollments.findFirst({
					where: eq(
						schema.studentCourseEnrollments.classCourseId,
						fixture.classCourse.id,
					),
				});
			if (!existingEnrollment) {
				throw new Error("Enrollment not found for fixture");
			}
			await db.insert(schema.studentCourseEnrollments).values({
				id: randomUUID(),
				studentId: existingEnrollment.studentId,
				classCourseId: existingEnrollment.classCourseId,
				courseId: existingEnrollment.courseId,
				sourceClassId: existingEnrollment.sourceClassId,
				academicYearId: existingEnrollment.academicYearId,
				status: "completed",
				attempt: existingEnrollment.attempt + 1,
				creditsAttempted: existingEnrollment.creditsAttempted,
				creditsEarned: existingEnrollment.creditsAttempted,
				startedAt: new Date(),
				completedAt: new Date(),
			});
			const limited = await admin.exams.listRetakeEligibility({
				examId: fixture.exam.id,
			});
			expect(limited.items[0].status).toBe("ineligible");
			expect(limited.items[0].reasons).toContain("ATTEMPT_LIMIT_REACHED");

			await admin.exams.upsertRetakeOverride({
				examId: fixture.exam.id,
				studentCourseEnrollmentId: limited.items[0].studentCourseEnrollmentId,
				decision: "force_eligible",
				reason: "jury override",
			});
			const overridden = await admin.exams.listRetakeEligibility({
				examId: fixture.exam.id,
			});
			expect(overridden.items[0].status).toBe("eligible");
			expect(overridden.items[0].reasons).toContain("OVERRIDE_FORCE_ELIGIBLE");
		});
	});
});
