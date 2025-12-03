import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import {
	asAdmin,
	createProgram,
	createTeachingUnit,
	createUser,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("courses router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.courses.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("supports CRUD", async () => {
		const program = await createProgram();
		const unit = await createTeachingUnit({ programId: program.id });
		const teacher = await createUser();
		const admin = createCaller(asAdmin());
		const course = await admin.courses.create({
			code: "MATH101",
			name: "Math",
			hours: 30,
			program: program.id,
			teachingUnitId: unit.id,
			defaultTeacher: teacher.profile.id,
		});
		expect(course.program).toBe(program.id);

		const updated = await admin.courses.update({
			id: course.id,
			name: "Math2",
		});
		expect(updated.name).toBe("Math2");

		await admin.courses.delete({ id: course.id });
		const list = await admin.courses.list({ programId: program.id });
		expect(list.items.length).toBe(0);
	});
});
