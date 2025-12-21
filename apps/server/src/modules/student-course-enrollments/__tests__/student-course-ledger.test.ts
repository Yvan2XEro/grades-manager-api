import { describe, expect, it } from "bun:test";
import {
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createFaculty,
	createProgram,
	createStudent,
	createTeachingUnit,
} from "@/lib/test-utils";
import { evaluateStudentPromotion } from "@/modules/promotions";
import { summarizeStudent } from "@/modules/student-credit-ledger";
import * as enrollmentsService from "../student-course-enrollments.service";

async function setupCourseWithCredits(credits: number) {
	const faculty = await createFaculty();
	const program = await createProgram({ faculty: faculty.id });
	const academicYear = await createAcademicYear();
	const teachingUnit = await createTeachingUnit({
		programId: program.id,
		credits,
	});
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
	});
	const course = await createCourse({
		program: program.id,
		teachingUnitId: teachingUnit.id,
	});
	const classCourse = await createClassCourse({
		class: klass.id,
		course: course.id,
	});
	const student = await createStudent({ class: klass.id });
	return { student, classCourse, academicYear };
}

describe("student course enrollments – ledger integration", () => {
	it("tracks credits for lifecycle transitions", async () => {
		const { student, classCourse } = await setupCourseWithCredits(30);
		const enrollment = await enrollmentsService.createEnrollment({
			studentId: student.id,
			classCourseId: classCourse.id,
			status: "active",
		});
		let summary = await summarizeStudent(student.id);
		expect(summary.creditsInProgress).toBe(30);
		expect(summary.creditsEarned).toBe(0);

		await enrollmentsService.updateStatus(
			enrollment.id,
			student.institutionId,
			"completed",
		);
		summary = await summarizeStudent(student.id);
		expect(summary.creditsInProgress).toBe(0);
		expect(summary.creditsEarned).toBe(30);
	});

	it("evaluates promotions through the rules engine", async () => {
		const { student, classCourse } = await setupCourseWithCredits(60);
		const enrollment = await enrollmentsService.createEnrollment({
			studentId: student.id,
			classCourseId: classCourse.id,
			status: "completed",
		});
		expect(enrollment).toBeTruthy();
		const result = await evaluateStudentPromotion(student.id);
		expect(result.eligible).toBe(true);
		expect(result.totalCreditsEarned).toBeGreaterThanOrEqual(60);
	});
});
