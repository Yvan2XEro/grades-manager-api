import { describe, it, expect } from "bun:test";
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "../../../routers";
import { makeTestContext, asAdmin, asSuperAdmin } from "../../../lib/test-utils";

const createCaller = createCallerFactory(appRouter);

describe("academic years router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.academicYears.list({})).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });

  it("supports CRUD and setActive", async () => {
    const admin = createCaller(asAdmin());
    const year = await admin.academicYears.create({ name: "2025", startDate: new Date(), endDate: new Date(Date.now() + 86400000) });
    expect(year.id).toBeTruthy();

    const updated = await admin.academicYears.update({ id: year.id, name: "2025/2026" });
    expect(updated.name).toBe("2025/2026");

    const superCaller = createCaller(asSuperAdmin());
    const set = await superCaller.academicYears.setActive({ id: year.id, isActive: true });
    expect(set.isActive).toBe(true);
  });
});
