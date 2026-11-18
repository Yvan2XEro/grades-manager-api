import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

beforeAll(async () => {
	await setupTestInstitution();
});

describe("academicYears.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(caller.academicYears.list()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("returns empty array for a new institution", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.academicYears.list();
		expect(Array.isArray(result)).toBe(true);
	});
});

describe("academicYears.create", () => {
	it("rejects guest requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.academicYears.create({
				name: "2025-2026",
				startDate: new Date("2025-09-01"),
				endDate: new Date("2026-06-30"),
			}),
		).rejects.toBeDefined();
	});

	it("creates an academic year and returns it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const year = await caller.academicYears.create({
			name: "2025-2026",
			startDate: new Date("2025-09-01"),
			endDate: new Date("2026-06-30"),
		});
		expect(year.id).toBeString();
		expect(year.name).toBe("2025-2026");
		expect(year.status).toBe("active");
	});
});

describe("academicYears.setActive + close", () => {
	it("sets a year to active and closes it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const year = await caller.academicYears.create({
			name: "2024-2025",
			startDate: new Date("2024-09-01"),
			endDate: new Date("2025-06-30"),
		});

		const activated = await caller.academicYears.setActive({ id: year.id });
		expect(activated.status).toBe("active");

		const closed = await caller.academicYears.close({ id: year.id });
		expect(closed.status).toBe("closed");
	});

	it("throws NOT_FOUND for unknown id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.academicYears.setActive({
				id: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
