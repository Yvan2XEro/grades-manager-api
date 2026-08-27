import { beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

beforeAll(async () => {
	await setupTestInstitution();
});

describe("students.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(caller.students.list({})).rejects.toBeDefined();
	});

	it("returns array for authenticated users", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.students.list({});
		expect(Array.isArray(result)).toBe(true);
	});
});

describe("students.create + get + update", () => {
	it("creates a student", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const student = await caller.students.create({
			firstName: "Alice",
			lastName: "Nguema",
			gender: "F",
			reportCardLanguage: "fr",
		});
		expect(student.id).toBeString();
		expect(student.firstName).toBe("Alice");
	});

	it("gets a student by id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const created = await caller.students.create({
			firstName: "Bob",
			lastName: "Mvondo",
		});
		const fetched = await caller.students.get({ id: created.id });
		expect(fetched.id).toBe(created.id);
	});

	it("updates a student", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const created = await caller.students.create({
			firstName: "Carol",
			lastName: "Biya",
		});
		const updated = await caller.students.update({
			id: created.id,
			mnu: "MNU-12345",
		});
		expect(updated.mnu).toBe("MNU-12345");
	});

	it("throws NOT_FOUND for unknown id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.students.get({ id: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
