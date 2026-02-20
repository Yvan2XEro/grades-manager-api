import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createFaculty,
	createProgram,
	createStudent,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
} from "@/lib/test-utils";
import { summarizeStudent } from "@/modules/student-credit-ledger";
import { recomputeForStudent } from "@/modules/student-credit-ledger/student-credit-ledger.service";
import * as enrollmentsService from "../student-course-enrollments.service";

async function setupUeWithCourses(opts: {
	ueCredits: number;
	courseCount: number;
	coefficients?: number[];
	examPercentages?: number[];
}) {
	const faculty = await createFaculty();
	const program = await createProgram({ institutionId: faculty.id });
	const academicYear = await createAcademicYear({ institutionId: faculty.id });
	const teachingUnit = await createTeachingUnit({
		programId: program.id,
		credits: opts.ueCredits,
	});
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
		institutionId: faculty.id,
	});
	const student = await createStudent({
		class: klass.id,
		institutionId: faculty.id,
	});

	// Create enrollment for the student
	await db.insert(schema.enrollments).values({
		studentId: student.id,
		classId: klass.id,
		academicYearId: academicYear.id,
		institutionId: faculty.id,
		status: "active",
	});

	const courses = [];
	for (let i = 0; i < opts.courseCount; i++) {
		const course = await createCourse({
			program: program.id,
			teachingUnitId: teachingUnit.id,
		});
		const classCourse = await createClassCourse({
			class: klass.id,
			course: course.id,
			institutionId: faculty.id,
			coefficient: opts.coefficients?.[i]?.toString() ?? "1",
		});
		courses.push({ course, classCourse });
	}

	return {
		student,
		academicYear,
		klass,
		teachingUnit,
		courses,
		institutionId: faculty.id,
	};
}

async function createExamAndGrade(
	classCourseId: string,
	studentId: string,
	score: number,
	institutionId: string,
	percentage = 100,
) {
	const [exam] = await db
		.insert(schema.exams)
		.values({
			name: `Exam-${Math.random().toString(36).slice(2)}`,
			type: "WRITTEN",
			date: new Date(),
			percentage: percentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();

	await db.insert(schema.grades).values({
		student: studentId,
		exam: exam.id,
		score: score.toString(),
	});

	return exam;
}

describe("student course enrollments – credit ledger (UE validation)", () => {
	it("credits are 0 when no grades exist (enrollment only)", async () => {
		const { student, courses, academicYear } = await setupUeWithCourses({
			ueCredits: 30,
			courseCount: 2,
		});

		// Enroll but don't grade
		for (const { classCourse } of courses) {
			await enrollmentsService.createEnrollment({
				studentId: student.id,
				classCourseId: classCourse.id,
				status: "active",
			});
		}

		const summary = await summarizeStudent(student.id);
		expect(summary.creditsInProgress).toBe(0);
		expect(summary.creditsEarned).toBe(0);
	});

	it("UE validated (credits earned) when all courses graded >= 10 avg", async () => {
		const { student, courses, academicYear, institutionId } =
			await setupUeWithCourses({
				ueCredits: 30,
				courseCount: 2,
				coefficients: [2, 3],
			});

		for (const { classCourse } of courses) {
			await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
		}

		// Grade both courses above 10
		await createExamAndGrade(
			courses[0].classCourse.id,
			student.id,
			14,
			institutionId,
		);
		await createExamAndGrade(
			courses[1].classCourse.id,
			student.id,
			12,
			institutionId,
		);

		// Recompute credits
		await recomputeForStudent(student.id, academicYear.id);

		const summary = await summarizeStudent(student.id);
		// UE average = (14*2 + 12*3) / (2+3) = (28+36)/5 = 12.8 >= 10 → validated
		expect(summary.creditsEarned).toBe(30);
		expect(summary.creditsInProgress).toBe(0);
	});

	it("UE failed (0 credits) when weighted average < 10", async () => {
		const { student, courses, academicYear, institutionId } =
			await setupUeWithCourses({
				ueCredits: 30,
				courseCount: 2,
				coefficients: [1, 3],
			});

		for (const { classCourse } of courses) {
			await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
		}

		// High score on low coefficient, low score on high coefficient
		await createExamAndGrade(
			courses[0].classCourse.id,
			student.id,
			18,
			institutionId,
		);
		await createExamAndGrade(
			courses[1].classCourse.id,
			student.id,
			6,
			institutionId,
		);

		await recomputeForStudent(student.id, academicYear.id);

		const summary = await summarizeStudent(student.id);
		// UE average = (18*1 + 6*3) / (1+3) = (18+18)/4 = 9 < 10 → failed
		expect(summary.creditsEarned).toBe(0);
		expect(summary.creditsInProgress).toBe(0);
	});

	it("UE incomplete (credits in progress) when not all courses graded", async () => {
		const { student, courses, academicYear, institutionId } =
			await setupUeWithCourses({
				ueCredits: 30,
				courseCount: 2,
			});

		for (const { classCourse } of courses) {
			await ensureStudentCourseEnrollment(student.id, classCourse.id, "active");
		}

		// Grade only the first course
		await createExamAndGrade(
			courses[0].classCourse.id,
			student.id,
			15,
			institutionId,
		);

		await recomputeForStudent(student.id, academicYear.id);

		const summary = await summarizeStudent(student.id);
		// Only 1 of 2 courses graded → incomplete → credits in progress
		expect(summary.creditsEarned).toBe(0);
		expect(summary.creditsInProgress).toBe(30);
	});
});
