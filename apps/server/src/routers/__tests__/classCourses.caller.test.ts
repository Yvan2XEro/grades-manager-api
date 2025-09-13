import { describe, it, expect } from "bun:test";
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "../index";
import { makeTestContext, asAdmin, createClass, createCourse, createProfile } from "../../lib/test-utils";

const createCaller = createCallerFactory(appRouter);

describe("class courses router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.classCourses.list({})).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });

  it("supports CRUD", async () => {
    const klass = await createClass();
    const course = await createCourse({ program: klass.program });
    const teacher = await createProfile();
    const admin = createCaller(asAdmin());
    const cc = await admin.classCourses.create({ class: klass.id, course: course.id, teacher: teacher.id });
    expect(cc.class).toBe(klass.id);

    const updated = await admin.classCourses.update({ id: cc.id, teacher: teacher.id });
    expect(updated.teacher).toBe(teacher.id);

    await admin.classCourses.delete({ id: cc.id });
    const list = await admin.classCourses.list({ classId: klass.id });
    expect(list.items.length).toBe(0);
  });
});
