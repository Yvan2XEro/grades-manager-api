import { beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let academicYearId: string;
let trackId: string;
let classId: string;

beforeAll(async () => {
	await setupTestInstitution();
	const admin = appRouter.createCaller(asAdmin());
	const year = await admin.academicYears.create({
		name: `classes-test-${Date.now()}`,
		startDate: new Date("2025-09-01"),
		endDate: new Date("2026-06-30"),
	});
	academicYearId = year.id;
	const track = await admin.tracks.create({
		name: "Sciences D",
		code: `D-${Date.now()}`,
		cycleLevel: "second_cycle",
	});
	trackId = track.id;
});

describe("classes.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(
			caller.classes.list({
				academicYearId: "00000000-0000-0000-0000-000000000000",
			}),
		).rejects.toBeDefined();
	});

	it("returns empty array for a new year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.classes.list({ academicYearId });
		expect(result).toEqual([]);
	});
});

describe("classes.create", () => {
	it("creates a class and returns it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const cls = await caller.classes.create({
			name: "Terminale D",
			code: `TLE-D-${Date.now()}`,
			level: "Tle",
			academicYearId,
			trackId,
		});
		expect(cls.id).toBeString();
		expect(cls.level).toBe("Tle");
		expect(cls.trackId).toBe(trackId);
		classId = cls.id;
	});

	it("rejects duplicate code within academic year", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const code = `DUPE-${Date.now()}`;
		await caller.classes.create({
			name: "Class A",
			code,
			level: "3e",
			academicYearId,
		});
		await expect(
			caller.classes.create({
				name: "Class B",
				code,
				level: "3e",
				academicYearId,
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("classes.get", () => {
	it("returns the class by id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const cls = await caller.classes.get({ id: classId });
		expect(cls.id).toBe(classId);
	});

	it("throws NOT_FOUND for unknown id", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.classes.get({ id: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("classes.getRoster", () => {
	it("returns empty roster for a new class", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const roster = await caller.classes.getRoster({ classId });
		expect(Array.isArray(roster)).toBe(true);
		expect(roster).toHaveLength(0);
	});
});
