import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("study cycles router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.studyCycles.listCycles({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("manages cycles and levels", async () => {
		const admin = createCaller(asAdmin());
		// institutionId is auto-filled from context, no need to pass it
		const cycle = await admin.studyCycles.createCycle({
			code: "bachelor",
			name: "Bachelor",
			totalCreditsRequired: 180,
			durationYears: 3,
		});
		expect(cycle.institutionId).toBeTruthy();
		expect(cycle.code).toBe("bachelor");

		const preloadedLevels = await admin.studyCycles.listLevels({
			cycleId: cycle.id,
		});
		const expectedLevelCount = cycle.durationYears ?? 0;
		expect(preloadedLevels.length).toBe(expectedLevelCount);
		expect(preloadedLevels[0]?.code).toBe("bachelor-L1");

		const level = await admin.studyCycles.createLevel({
			cycleId: cycle.id,
			code: "bachelor-L4",
			name: "Level 4",
			minCredits: 60,
		});
		expect(level.cycleId).toBe(cycle.id);
		expect(level.orderIndex).toBe(expectedLevelCount + 1);

		const levels = await admin.studyCycles.listLevels({ cycleId: cycle.id });
		expect(levels.length).toBe(preloadedLevels.length + 1);

		const cycles = await admin.studyCycles.listCycles({});
		expect(cycles.items.some(({ id }) => id === cycle.id)).toBe(true);

		await admin.studyCycles.deleteLevel({ id: level.id });
		const afterDeleteLevels = await admin.studyCycles.listLevels({
			cycleId: cycle.id,
		});
		expect(afterDeleteLevels.length).toBe(expectedLevelCount);

		await admin.studyCycles.deleteCycle({ id: cycle.id });
		const refreshed = await admin.studyCycles.listCycles({});
		expect(refreshed.items.some(({ id }) => id === cycle.id)).toBe(false);
	});
});
