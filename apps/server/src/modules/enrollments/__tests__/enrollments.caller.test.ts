import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createAcademicYear,
	createClass,
	createStudent,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("enrollments router", () => {
	it("requires auth to list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.enrollments.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("creates and updates enrollments", async () => {
		const admin = createCaller(asAdmin());
		const klass = await createClass();
		const student = await createStudent({ class: klass.id });
		const year = await createAcademicYear();
		const enrollment = await admin.enrollments.create({
			studentId: student.id,
			classId: klass.id,
			academicYearId: year.id,
			status: "active",
		});
		expect(enrollment.studentId).toBe(student.id);

		const updated = await admin.enrollments.updateStatus({
			id: enrollment.id,
			status: "completed",
		});
		expect(updated?.status).toBe("completed");

		const list = await admin.enrollments.list({ studentId: student.id });
		expect(list.items.length).toBeGreaterThan(0);
	});
});
