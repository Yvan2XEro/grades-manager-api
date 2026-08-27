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

describe("subjects.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(caller.subjects.list()).rejects.toBeDefined();
	});

	it("returns an array for authenticated users", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.subjects.list();
		expect(Array.isArray(result)).toBe(true);
	});
});

describe("subjects.create", () => {
	it("creates a subject and returns it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const subject = await caller.subjects.create({
			name: "Mathematics",
			nameFr: "Mathématiques",
			code: `MATH-${Date.now()}`,
			minesecCode: "MTH",
			subjectGroup: "sciences",
		});
		expect(subject.id).toBeString();
		expect(subject.name).toBe("Mathematics");
	});

	it("rejects duplicate code within institution", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const code = `PHYS-${Date.now()}`;
		await caller.subjects.create({ name: "Physics", nameFr: "Physique", code });
		await expect(
			caller.subjects.create({ name: "Physics 2", nameFr: "Physique 2", code }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("subjects.update", () => {
	it("updates allowed fields", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const subject = await caller.subjects.create({
			name: "English",
			nameFr: "Anglais",
			code: `ENG-${Date.now()}`,
		});
		const updated = await caller.subjects.update({
			id: subject.id,
			subjectGroup: "languages",
		});
		expect(updated.subjectGroup).toBe("languages");
	});

	it("throws NOT_FOUND for unknown id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.subjects.update({
				id: "00000000-0000-0000-0000-000000000000",
				name: "X",
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
