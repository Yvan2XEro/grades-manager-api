import { describe, expect, it } from "bun:test";
import {
	asAdmin,
        createUser,
	createProgram,
	makeTestContext,
} from "@/lib/test-utils";

import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

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
                const teacher = await createUser();
		const admin = createCaller(asAdmin());
		const course = await admin.courses.create({
			name: "Math",
			credits: 3,
			hours: 30,
			program: program.id,
			defaultTeacher: teacher.id,
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
