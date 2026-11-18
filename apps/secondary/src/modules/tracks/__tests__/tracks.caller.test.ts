import { beforeAll, describe, expect, it } from "bun:test";
import {
	asAdmin,
	asGuest,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

let trackId: string;
let subjectId: string;

beforeAll(async () => {
	await setupTestInstitution();
	const admin = appRouter.createCaller(asAdmin());
	const subject = await admin.subjects.create({
		name: "French",
		nameFr: "Français",
		code: `FR-${Date.now()}`,
	});
	subjectId = subject.id;
});

describe("tracks.list", () => {
	it("rejects unauthenticated requests", async () => {
		const caller = appRouter.createCaller(asGuest());
		await expect(caller.tracks.list({})).rejects.toBeDefined();
	});

	it("returns an array for authenticated users", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const result = await caller.tracks.list({});
		expect(Array.isArray(result.items)).toBe(true);
	});
});

describe("tracks.create", () => {
	it("creates a track and returns it", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const track = await caller.tracks.create({
			name: "Sciences Series C",
			code: `C-${Date.now()}`,
			cycleLevel: "second_cycle",
		});
		expect(track.id).toBeString();
		expect(track.cycleLevel).toBe("second_cycle");
		expect(track.isOfficial).toBe(false);
		trackId = track.id;
	});

	it("rejects duplicate code within institution", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const code = `A4-${Date.now()}`;
		await caller.tracks.create({
			name: "Arts A4",
			code,
			cycleLevel: "second_cycle",
		});
		await expect(
			caller.tracks.create({
				name: "Arts A4 dupe",
				code,
				cycleLevel: "second_cycle",
			}),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("tracks.upsertCoefficient", () => {
	it("creates and updates a coefficient", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const first = await caller.tracks.upsertCoefficient({
			trackId,
			subjectId,
			coefficient: 4,
			isOfficialExamSubject: false,
		});
		expect(first.coefficient).toBe(4);
		const updated = await caller.tracks.upsertCoefficient({
			trackId,
			subjectId,
			coefficient: 6,
			isOfficialExamSubject: true,
		});
		expect(updated.coefficient).toBe(6);
		expect(updated.isOfficialExamSubject).toBe(true);
	});

	it("rejects coefficient for a track not in institution", async () => {
		const caller = appRouter.createCaller(asAdmin());
		await expect(
			caller.tracks.upsertCoefficient({
				trackId: "00000000-0000-0000-0000-000000000000",
				subjectId,
				coefficient: 3,
			}),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("tracks.getCoefficientsGrid", () => {
	it("returns all coefficients for a track with subject info", async () => {
		const caller = appRouter.createCaller(asAdmin());
		const grid = await caller.tracks.getCoefficientsGrid({ trackId });
		expect(Array.isArray(grid)).toBe(true);
		expect(grid.length).toBeGreaterThan(0);
		expect(grid[0]).toHaveProperty("subject");
		expect(grid[0]).toHaveProperty("coefficient");
	});
});
