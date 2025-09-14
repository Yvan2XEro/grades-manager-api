import { describe, expect, it } from "bun:test";
import {
	asAdmin,
	createExam,
	createStudent,
	makeTestContext,
} from "../../../lib/test-utils";
import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

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
		const exam = await createExam();
		const student = await createStudent();
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
});
