import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createClass,
	createCourse,
	createUser,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("class courses router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.classCourses.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("supports CRUD", async () => {
		const klass = await createClass();
		const course = await createCourse({ program: klass.program });
		const teacher = await createUser();
		const admin = createCaller(asAdmin());
		const cc = await admin.classCourses.create({
			class: klass.id,
			course: course.id,
			teacher: teacher.id,
		});
		expect(cc.class).toBe(klass.id);

		const updated = await admin.classCourses.update({
			id: cc.id,
			teacher: teacher.id,
		});
		expect(updated.teacher).toBe(teacher.id);

		await admin.classCourses.delete({ id: cc.id });
		const list = await admin.classCourses.list({ classId: klass.id });
		expect(list.items.length).toBe(0);
	});
});
