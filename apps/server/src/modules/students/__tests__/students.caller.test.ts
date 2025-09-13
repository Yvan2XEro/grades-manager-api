import { createCallerFactory } from "@trpc/server";
import { describe, expect, it } from "bun:test";
import { asAdmin, createClass, makeTestContext } from "../../../lib/test-utils";
import { appRouter } from "../../../routers/index";

const createCaller = createCallerFactory(appRouter);

describe("students router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.students.list({})).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });

  it("enforces uniqueness", async () => {
    const admin = createCaller(asAdmin());
    const klass = await createClass();
    await admin.students.create({ firstName: "A", lastName: "B", email: "s@example.com", registrationNumber: "1", classId: klass.id });
    await expect(
      admin.students.create({ firstName: "A", lastName: "B", email: "s@example.com", registrationNumber: "2", classId: klass.id })
    ).rejects.toHaveProperty("code", "CONFLICT");
  });
});
