import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createClassCourse,
	createCourse,
	createProgram,
	createStudent,
	createTeachingUnit,
	ensureStudentCourseEnrollment,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = () => appRouter.createCaller(asAdmin());

/**
 * Build a fixture with 2 UEs, each with 2 courses (CC + EX exams).
 * Returns all IDs needed to call getPVData and create grades.
 */
async function setupPVFixture(opts?: {
	ue1Credits?: number;
	ue2Credits?: number;
	coefficients?: [number, number, number, number]; // [ue1c1, ue1c2, ue2c1, ue2c2]
}) {
	const program = await createProgram();
	const academicYear = await createAcademicYear();
	const klass = await createClass({
		program: program.id,
		academicYear: academicYear.id,
	});

	// Retrieve the semesterId from the class
	const classRecord = await db.query.classes.findFirst({
		where: (c, { eq }) => eq(c.id, klass.id),
	});
	const semesterId = classRecord!.semesterId!;

	const coefficients = opts?.coefficients ?? [2, 3, 1, 4];

	// UE 1
	const ue1 = await createTeachingUnit({
		programId: program.id,
		credits: opts?.ue1Credits ?? 6,
	});
	const course1a = await createCourse({
		program: program.id,
		teachingUnitId: ue1.id,
	});
	const course1b = await createCourse({
		program: program.id,
		teachingUnitId: ue1.id,
	});
	const cc1a = await createClassCourse({
		class: klass.id,
		course: course1a.id,
		coefficient: coefficients[0].toString(),
		semesterId,
	});
	const cc1b = await createClassCourse({
		class: klass.id,
		course: course1b.id,
		coefficient: coefficients[1].toString(),
		semesterId,
	});

	// UE 2
	const ue2 = await createTeachingUnit({
		programId: program.id,
		credits: opts?.ue2Credits ?? 4,
	});
	const course2a = await createCourse({
		program: program.id,
		teachingUnitId: ue2.id,
	});
	const course2b = await createCourse({
		program: program.id,
		teachingUnitId: ue2.id,
	});
	const cc2a = await createClassCourse({
		class: klass.id,
		course: course2a.id,
		coefficient: coefficients[2].toString(),
		semesterId,
	});
	const cc2b = await createClassCourse({
		class: klass.id,
		course: course2b.id,
		coefficient: coefficients[3].toString(),
		semesterId,
	});

	// Create student
	const student = await createStudent({ class: klass.id });
	await db.insert(schema.enrollments).values({
		studentId: student.id,
		classId: klass.id,
		academicYearId: academicYear.id,
		institutionId: klass.institutionId,
		status: "active",
	});

	// Enroll in all class courses
	for (const cc of [cc1a, cc1b, cc2a, cc2b]) {
		await ensureStudentCourseEnrollment(student.id, cc.id, "active");
	}

	return {
		program,
		academicYear,
		klass,
		semesterId,
		ue1,
		ue2,
		classCourses: { cc1a, cc1b, cc2a, cc2b },
		student,
	};
}

/** Helper to create CC + EX exams with grades for a class-course */
async function createExamsWithGrade(
	classCourseId: string,
	studentId: string,
	institutionId: string,
	ccScore: number,
	exScore: number,
	ccPercentage = 40,
	exPercentage = 60,
) {
	const [ccExam] = await db
		.insert(schema.exams)
		.values({
			name: `CC-${Math.random().toString(36).slice(2, 8)}`,
			type: "CC",
			date: new Date(),
			percentage: ccPercentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();

	const [exExam] = await db
		.insert(schema.exams)
		.values({
			name: `EX-${Math.random().toString(36).slice(2, 8)}`,
			type: "EXAMEN",
			date: new Date(),
			percentage: exPercentage.toString(),
			classCourse: classCourseId,
			status: "approved",
			isLocked: false,
			scheduledAt: new Date(),
			validatedAt: new Date(),
			institutionId,
		})
		.returning();

	await db.insert(schema.grades).values([
		{ student: studentId, exam: ccExam.id, score: ccScore.toString() },
		{ student: studentId, exam: exExam.id, score: exScore.toString() },
	]);

	return { ccExam, exExam };
}

describe("exports.getPVData", () => {
	it("returns correct UE structure with coefficient-weighted averages", async () => {
		const {
			academicYear,
			klass,
			semesterId,
			classCourses: { cc1a, cc1b, cc2a, cc2b },
			student,
		} = await setupPVFixture({
			ue1Credits: 6,
			ue2Credits: 4,
			coefficients: [2, 3, 1, 4],
		});

		const instId = klass.institutionId;

		// UE1: course1a (coeff 2): CC=14, EX=16 → avg = 14×0.4 + 16×0.6 = 15.2
		// UE1: course1b (coeff 3): CC=10, EX=12 → avg = 10×0.4 + 12×0.6 = 11.2
		// UE1 avg = (15.2×2 + 11.2×3) / (2+3) = (30.4+33.6)/5 = 12.8 → validated (≥10)
		await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
		await createExamsWithGrade(cc1b.id, student.id, instId, 10, 12);

		// UE2: course2a (coeff 1): CC=8, EX=6 → avg = 8×0.4 + 6×0.6 = 6.8
		// UE2: course2b (coeff 4): CC=12, EX=14 → avg = 12×0.4 + 14×0.6 = 13.2
		// UE2 avg = (6.8×1 + 13.2×4) / (1+4) = (6.8+52.8)/5 = 11.92 → validated (≥10)
		await createExamsWithGrade(cc2a.id, student.id, instId, 8, 6);
		await createExamsWithGrade(cc2b.id, student.id, instId, 12, 14);

		const caller = createCaller();
		const result = await caller.exports.getPVData({
			classId: klass.id,
			semesterId,
			academicYearId: academicYear.id,
		});

		expect(result.students).toHaveLength(1);
		const s = result.students[0];

		// Check UE grades
		expect(s.ueGrades).toHaveLength(2);

		// Find UE1 and UE2 (order may vary)
		const ue1Grade = s.ueGrades.find(
			(ug: any) => Math.abs((ug.average ?? 0) - 12.8) < 0.01,
		);
		const ue2Grade = s.ueGrades.find(
			(ug: any) => Math.abs((ug.average ?? 0) - 11.92) < 0.01,
		);

		expect(ue1Grade).toBeTruthy();
		expect(ue1Grade!.decision).toBe("Ac");
		expect(ue1Grade!.credits).toBe(6);

		expect(ue2Grade).toBeTruthy();
		expect(ue2Grade!.decision).toBe("Ac");
		expect(ue2Grade!.credits).toBe(4);

		// Total credits = 6 + 4 = 10
		expect(s.totalCredits).toBe(10);

		// General average is credit-weighted:
		// (12.8 × 6 + 11.92 × 4) / (6 + 4) = (76.8 + 47.68) / 10 = 12.448
		expect(s.generalAverage).toBeCloseTo(12.448, 2);
		expect(s.overallDecision).toBe("ACQUIS");
	});

	it("UE with failed average gives 0 credits and NON ACQUIS decision", async () => {
		const {
			academicYear,
			klass,
			semesterId,
			classCourses: { cc1a, cc1b, cc2a, cc2b },
			student,
		} = await setupPVFixture({
			ue1Credits: 6,
			ue2Credits: 4,
			coefficients: [1, 1, 1, 1],
		});

		const instId = klass.institutionId;

		// UE1: course1a: CC=12, EX=14 → avg=13.2
		// UE1: course1b: CC=10, EX=11 → avg=10.6
		// UE1 avg = (13.2+10.6)/2 = 11.9 → validated
		await createExamsWithGrade(cc1a.id, student.id, instId, 12, 14);
		await createExamsWithGrade(cc1b.id, student.id, instId, 10, 11);

		// UE2: course2a: CC=4, EX=5 → avg=4.6
		// UE2: course2b: CC=6, EX=7 → avg=6.6
		// UE2 avg = (4.6+6.6)/2 = 5.6 → failed (<10)
		await createExamsWithGrade(cc2a.id, student.id, instId, 4, 5);
		await createExamsWithGrade(cc2b.id, student.id, instId, 6, 7);

		const caller = createCaller();
		const result = await caller.exports.getPVData({
			classId: klass.id,
			semesterId,
			academicYearId: academicYear.id,
		});

		const s = result.students[0];

		// UE1 validated → 6 credits, UE2 failed → 0 credits
		const passedUe = s.ueGrades.find((ug: any) => ug.decision === "Ac");
		const failedUe = s.ueGrades.find((ug: any) => ug.decision === "Nac");

		expect(passedUe).toBeTruthy();
		expect(passedUe!.credits).toBe(6);

		expect(failedUe).toBeTruthy();
		expect(failedUe!.credits).toBe(0);

		// Only 6 credits earned
		expect(s.totalCredits).toBe(6);

		// General avg = (11.9×6 + 5.6×4) / (6+4) = (71.4+22.4)/10 = 9.38 → NON ACQUIS
		expect(s.generalAverage).toBeCloseTo(9.38, 1);
		expect(s.overallDecision).toBe("NON ACQUIS");
	});

	it("incomplete UE (missing grades) gives credits=0 and Inc decision", async () => {
		const {
			academicYear,
			klass,
			semesterId,
			classCourses: { cc1a, cc1b, cc2a, cc2b },
			student,
		} = await setupPVFixture({
			ue1Credits: 6,
			ue2Credits: 4,
			coefficients: [1, 1, 1, 1],
		});

		const instId = klass.institutionId;

		// UE1: both courses graded
		await createExamsWithGrade(cc1a.id, student.id, instId, 14, 16);
		await createExamsWithGrade(cc1b.id, student.id, instId, 12, 13);

		// UE2: only one course graded (course2a), course2b has no grades
		await createExamsWithGrade(cc2a.id, student.id, instId, 10, 12);

		const caller = createCaller();
		const result = await caller.exports.getPVData({
			classId: klass.id,
			semesterId,
			academicYearId: academicYear.id,
		});

		const s = result.students[0];

		const completeUe = s.ueGrades.find((ug: any) => ug.isComplete === true);
		const incompleteUe = s.ueGrades.find((ug: any) => ug.isComplete === false);

		expect(completeUe).toBeTruthy();
		expect(completeUe!.decision).toBe("Ac");

		expect(incompleteUe).toBeTruthy();
		expect(incompleteUe!.decision).toBe("Inc");
		expect(incompleteUe!.credits).toBe(0);
		expect(incompleteUe!.average).toBeNull();

		// General average only uses the complete UE
		// UE1 avg = (15.2+12.4)/2 = 13.8 → only UE with avg
		// Since only one UE has an average, general = 13.8
		expect(s.generalAverage).toBeTruthy();
	});

	it("global success rate is correct", async () => {
		const {
			academicYear,
			klass,
			semesterId,
			classCourses: { cc1a, cc1b, cc2a, cc2b },
			student: student1,
		} = await setupPVFixture({
			ue1Credits: 6,
			ue2Credits: 4,
			coefficients: [1, 1, 1, 1],
		});

		const instId = klass.institutionId;

		// Student 2
		const student2 = await createStudent({ class: klass.id });
		await db.insert(schema.enrollments).values({
			studentId: student2.id,
			classId: klass.id,
			academicYearId: academicYear.id,
			institutionId: instId,
			status: "active",
		});
		for (const cc of [cc1a, cc1b, cc2a, cc2b]) {
			await ensureStudentCourseEnrollment(student2.id, cc.id, "active");
		}

		// Student 1: all passing → ACQUIS
		await createExamsWithGrade(cc1a.id, student1.id, instId, 14, 16);
		await createExamsWithGrade(cc1b.id, student1.id, instId, 12, 13);
		await createExamsWithGrade(cc2a.id, student1.id, instId, 11, 12);
		await createExamsWithGrade(cc2b.id, student1.id, instId, 10, 11);

		// Student 2: all failing → NON ACQUIS
		await createExamsWithGrade(cc1a.id, student2.id, instId, 4, 5);
		await createExamsWithGrade(cc1b.id, student2.id, instId, 3, 4);
		await createExamsWithGrade(cc2a.id, student2.id, instId, 5, 6);
		await createExamsWithGrade(cc2b.id, student2.id, instId, 4, 5);

		const caller = createCaller();
		const result = await caller.exports.getPVData({
			classId: klass.id,
			semesterId,
			academicYearId: academicYear.id,
		});

		expect(result.students).toHaveLength(2);
		// 1 out of 2 passed → 50%
		expect(result.globalSuccessRate).toBe(50);
	});
});
