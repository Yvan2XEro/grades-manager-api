import { describe, it, expect } from "bun:test";
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "../index";
import { makeTestContext, asAdmin, createFaculty } from "../../lib/test-utils";

const createCaller = createCallerFactory(appRouter);

describe("programs router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.programs.list({})).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });

  it("supports CRUD", async () => {
    const faculty = await createFaculty();
    const admin = createCaller(asAdmin());
    const program = await admin.programs.create({ name: "Prog", faculty: faculty.id });
    expect(program.faculty).toBe(faculty.id);

    const list = await admin.programs.list({ facultyId: faculty.id });
    expect(list.items[0].id).toBe(program.id);

    const updated = await admin.programs.update({ id: program.id, name: "Prog2" });
    expect(updated.name).toBe("Prog2");

    await admin.programs.delete({ id: program.id });
    const after = await admin.programs.list({ facultyId: faculty.id });
    expect(after.items.length).toBe(0);
  });
});
