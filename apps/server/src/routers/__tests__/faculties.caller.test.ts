import { describe, it, expect } from "bun:test";
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "../index";
import { makeTestContext, asAdmin, asSuperAdmin } from "../../lib/test-utils";

const createCaller = createCallerFactory(appRouter);

describe("faculties router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.faculties.list({})).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });

  it("enforces roles", async () => {
    const caller = createCaller(makeTestContext({ role: "USER" }));
    await expect(caller.faculties.create({ name: "F1" })).rejects.toHaveProperty("code", "FORBIDDEN");
  });

  it("supports CRUD", async () => {
    const admin = createCaller(asAdmin());
    const faculty = await admin.faculties.create({ name: "Science" });
    expect(faculty.id).toBeTruthy();

    const fetched = await admin.faculties.getById({ id: faculty.id });
    expect(fetched.name).toBe("Science");

    const updated = await admin.faculties.update({ id: faculty.id, name: "Sci" });
    expect(updated.name).toBe("Sci");

    const list = await admin.faculties.list({ limit: 1 });
    expect(list.items.length).toBe(1);

    const superCaller = createCaller(asSuperAdmin());
    await superCaller.faculties.delete({ id: faculty.id });
    const after = await superCaller.faculties.list({});
    expect(after.items.length).toBe(0);
  });
});
