import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createClass,
	createCourse,
	createStudent,
	ensureStudentCourseEnrollment,
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
		const teacherId = course.defaultTeacher;
		const admin = createCaller(asAdmin());
		const cc = await admin.classCourses.create({
			class: klass.id,
			course: course.id,
			teacher: teacherId,
			weeklyHours: 2,
		});
		expect(cc.class).toBe(klass.id);

		const updated = await admin.classCourses.update({
			id: cc.id,
			weeklyHours: 3,
		});
		expect(updated.weeklyHours).toBe(3);

		await admin.classCourses.delete({ id: cc.id });
		const list = await admin.classCourses.list({ classId: klass.id });
		expect(list.items.length).toBe(0);
	});

	it("returns roster with enrolled students only", async () => {
		const klass = await createClass();
		const course = await createCourse({ program: klass.program });
		const teacherId = course.defaultTeacher;
		const admin = createCaller(asAdmin());
		const cc = await admin.classCourses.create({
			class: klass.id,
			course: course.id,
			teacher: teacherId,
			weeklyHours: 2,
		});
		const enrolled = await createStudent({ class: klass.id });
		await ensureStudentCourseEnrollment(enrolled.id, cc.id, "active");
		await createStudent({ class: klass.id });
		const roster = await admin.classCourses.roster({ id: cc.id });
		expect(roster.students).toHaveLength(1);
		expect(roster.students[0].id).toBe(enrolled.id);
	});
});
