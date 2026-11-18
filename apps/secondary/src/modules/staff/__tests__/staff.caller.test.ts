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

describe("staff.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(caller.staff.list({})).rejects.toBeDefined();
	});

	it("returns array for authenticated users", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.staff.list({});
		expect(Array.isArray(result.items)).toBe(true);
	});
});

describe("staff.create + get + update", () => {
	it("creates a staff member", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const member = await caller.staff.create({
			firstName: "Jean",
			lastName: "Dupont",
			email: `jean-${Date.now()}@school.cm`,
			role: "teacher",
		});
		expect(member.id).toBeString();
		expect(member.role).toBe("teacher");
	});

	it("rejects duplicate email", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const email = `dup-${Date.now()}@school.cm`;
		await caller.staff.create({ firstName: "A", lastName: "B", email });
		await expect(
			caller.staff.create({ firstName: "C", lastName: "D", email }),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("updates a staff member", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const member = await caller.staff.create({
			firstName: "Marie",
			lastName: "Fouda",
			email: `marie-${Date.now()}@school.cm`,
		});
		const updated = await caller.staff.update({
			id: member.id,
			role: "principal",
		});
		expect(updated.role).toBe("principal");
	});

	it("gets a staff member by id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const created = await caller.staff.create({
			firstName: "Paul",
			lastName: "Njoko",
			email: `paul-${Date.now()}@school.cm`,
		});
		const fetched = await caller.staff.get({ id: created.id });
		expect(fetched.id).toBe(created.id);
		expect(fetched.firstName).toBe("Paul");
	});

	it("throws NOT_FOUND for unknown id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.staff.get({ id: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("staff.count", () => {
	it("returns number of staff members", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const count = await caller.staff.count();
		expect(typeof count).toBe("number");
		expect(count).toBeGreaterThanOrEqual(0);
	});
});
