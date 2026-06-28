import { describe, expect, it } from "bun:test";
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
