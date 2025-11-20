import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createClassCourse,
	createStudent,
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

		const student = await createStudent({ class: cc.class });
		await expect(
			admin.grades.upsertNote({
				studentId: student.id,
				examId: exam.id,
				score: 80,
			}),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});
});
