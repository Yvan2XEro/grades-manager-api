import { describe, expect, it } from "bun:test";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createRecapFixture,
	createStudent,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("grades router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(
			caller.grades.listByExam({ examId: "x" }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("upserts and respects locks", async () => {
		const admin = createCaller(asAdmin());
		const { exam, student } = await createRecapFixture();
		const grade = await admin.grades.upsertNote({
			studentId: student.id,
			examId: exam.id,
			score: 70,
		});
		const updated = await admin.grades.upsertNote({
			studentId: student.id,
			examId: exam.id,
			score: 80,
		});
		expect(updated.id).toBe(grade.id);
		expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
			new Date(grade.updatedAt).getTime(),
		);

		await admin.exams.lock({ examId: exam.id, lock: true });
		await expect(
			admin.grades.updateNote({ id: grade.id, score: 50 }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("rejects grading when student is not enrolled", async () => {
		const admin = createCaller(asAdmin());
		const { exam, klass } = await createRecapFixture();
		// Create outsider in same institution but different class
		const outsider = await createStudent({
			institutionId: klass.institutionId,
		});
		await expect(
			admin.grades.upsertNote({
				studentId: outsider.id,
				examId: exam.id,
				score: 60,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});

// ── Attendance eligibility gate (JVL-54) ─────────────────────────────────────

describe("attendance eligibility gate", () => {
	/** Insert two sessions for classCourse with no records (student treated as absent → 0%). */
	async function makeStudentBelowThreshold(
		classCourseId: string,
		institutionId: string,
		academicYearId: string,
	) {
		for (let i = 0; i < 2; i++) {
			const date = new Date(Date.now() - (i + 10) * 86400000)
				.toISOString()
				.slice(0, 10);
			await db.insert(schema.attendanceSessions).values({
				classCourseId,
				institutionId,
				academicYearId,
				sessionDate: date,
				isExceptional: true,
			});
		}
	}

	it("upsertNote: blocks when student is below attendance threshold", async () => {
		const admin = createCaller(asAdmin());
		const { classCourse, exam, student, academicYear } =
			await createRecapFixture({ classCourse: { attendanceThreshold: 75 } });

		await makeStudentBelowThreshold(
			classCourse.id,
			classCourse.institutionId,
			academicYear.id,
		);

		await expect(
			admin.grades.upsertNote({
				studentId: student.id,
				examId: exam.id,
				score: 60,
			}),
		).rejects.toHaveProperty("code", "PRECONDITION_FAILED");
	});

	it("updateNote: blocks when student is below attendance threshold", async () => {
		const admin = createCaller(asAdmin());
		const { classCourse, grade, student, academicYear } =
			await createRecapFixture({ classCourse: { attendanceThreshold: 75 } });

		await makeStudentBelowThreshold(
			classCourse.id,
			classCourse.institutionId,
			academicYear.id,
		);

		await expect(
			admin.grades.updateNote({ id: grade.id, score: 60 }),
		).rejects.toHaveProperty("code", "PRECONDITION_FAILED");
	});
});
