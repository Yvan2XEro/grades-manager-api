import { beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let academicYearId: string;

beforeAll(async () => {
	await setupTestInstitution();
	const admin = appRouter.createCaller(asAdmin());
	const year = await admin.academicYears.create({
		name: "2025-2026-terms-test",
		startDate: new Date("2025-09-01"),
		endDate: new Date("2026-06-30"),
	});
	academicYearId = year.id;
});

describe("terms.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.terms.list({
				academicYearId: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toBeDefined();
	});

	it("returns empty array for a new year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.terms.list({ academicYearId });
		expect(result).toEqual([]);
	});
});

describe("terms.create", () => {
	it("creates the three terms for a year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const t1 = await caller.terms.create({
			academicYearId,
			termNumber: 1,
			startDate: new Date("2025-09-08"),
			endDate: new Date("2025-11-28"),
		});
		expect(t1.termNumber).toBe(1);
		expect(t1.status).toBe("open");
		await caller.terms.create({
			academicYearId,
			termNumber: 2,
			startDate: new Date("2026-01-05"),
			endDate: new Date("2026-03-06"),
		});
		await caller.terms.create({
			academicYearId,
			termNumber: 3,
			startDate: new Date("2026-03-09"),
			endDate: new Date("2026-06-12"),
		});
		const list = await caller.terms.list({ academicYearId });
		expect(list).toHaveLength(3);
	});

	it("rejects duplicate termNumber for same year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.terms.create({
				academicYearId,
				termNumber: 1,
				startDate: new Date("2025-09-08"),
				endDate: new Date("2025-11-28"),
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("terms.open + close", () => {
	it("transitions term status", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const list = await caller.terms.list({ academicYearId });
		const term = list[0]!;
		const closed = await caller.terms.close({ id: term.id });
		expect(closed.status).toBe("closed");
		const opened = await caller.terms.open({ id: term.id });
		expect(opened.status).toBe("open");
	});
});

describe("terms.getActive", () => {
	it("returns the first open term for a year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const active = await caller.terms.getActive({ academicYearId });
		expect(active?.status).toBe("open");
	});
});
