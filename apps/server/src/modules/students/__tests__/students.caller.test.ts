import { describe, expect, it } from "bun:test";
import { asAdmin, createClass, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
const baseProfile = {
	firstName: "A",
	lastName: "B",
	email: "student@example.com",
	dateOfBirth: new Date("2000-01-01"),
	placeOfBirth: "Yaoundé",
	gender: "female" as const,
};

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
			classId: klass.id,
			registrationNumber: "1",
			profile: { ...baseProfile },
		});
		await expect(
			admin.students.create({
				classId: klass.id,
				registrationNumber: "2",
				profile: { ...baseProfile },
			}),
		).rejects.toHaveProperty("code", "CONFLICT");
	});

	it("bulk creates students and reports conflicts", async () => {
		const admin = createCaller(asAdmin());
		const klass = await createClass();
		await admin.students.create({
			classId: klass.id,
			registrationNumber: "1",
			profile: { ...baseProfile, email: "existing@example.com" },
		});
		const res = await admin.students.bulkCreate({
			classId: klass.id,
			students: [
				{
					...baseProfile,
					email: "bulk-new@example.com",
					registrationNumber: "2",
				},
				{
					...baseProfile,
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
