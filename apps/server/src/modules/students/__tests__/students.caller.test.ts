import { describe, expect, it } from "bun:test";
import { asAdmin, createClass, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("students router", () => {
  it("requires auth", async () => {
    const caller = createCaller(makeTestContext());
    await expect(caller.students.list({})).rejects.toHaveProperty(
      "code",
      "UNAUTHORIZED",
    );
  });

  it("enforces uniqueness", async () => {
    const admin = createCaller(asAdmin());
    const klass = await createClass();
    await admin.students.create({
      firstName: "A",
      lastName: "B",
      email: "s@example.com",
      registrationNumber: "1",
      classId: klass.id,
    });
    await expect(
      admin.students.create({
        firstName: "A",
        lastName: "B",
        email: "s@example.com",
        registrationNumber: "2",
        classId: klass.id,
      }),
    ).rejects.toHaveProperty("code", "CONFLICT");
  });

  it("bulk creates students and reports conflicts", async () => {
    const admin = createCaller(asAdmin());
    const klass = await createClass();
    await admin.students.create({
      firstName: "A",
      lastName: "B",
      email: "existing@example.com",
      registrationNumber: "1",
      classId: klass.id,
    });
    const res = await admin.students.bulkCreate({
      classId: klass.id,
      students: [
        {
          firstName: "C",
          lastName: "D",
          email: "new@example.com",
          registrationNumber: "2",
        },
        {
          firstName: "E",
          lastName: "F",
          email: "existing@example.com",
          registrationNumber: "3",
        },
      ],
    });
    expect(res.createdCount).toBe(1);
    expect(res.conflicts).toHaveLength(1);
  });

  it("fails when class does not exist", async () => {
    const admin = createCaller(asAdmin());
    await expect(
      admin.students.bulkCreate({
        classId: "missing",
        students: [],
      }),
    ).rejects.toHaveProperty("code", "NOT_FOUND");
  });
});
