import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, createFaculty, makeTestContext } from "@/lib/test-utils";
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
		const faculty = await createFaculty();
		const cycle = await admin.studyCycles.createCycle({
			facultyId: faculty.id,
			code: "bachelor",
			name: "Bachelor",
			totalCreditsRequired: 180,
			durationYears: 3,
		});
		expect(cycle.facultyId).toBe(faculty.id);

		const level = await admin.studyCycles.createLevel({
			cycleId: cycle.id,
			code: "L1",
			name: "Level 1",
			orderIndex: 1,
			minCredits: 60,
		});
		expect(level.cycleId).toBe(cycle.id);

		const levels = await admin.studyCycles.listLevels({ cycleId: cycle.id });
		expect(levels.length).toBeGreaterThanOrEqual(1);

		const cycles = await admin.studyCycles.listCycles({
			facultyId: faculty.id,
		});
		expect(cycles.items.length).toBe(1);

		await admin.studyCycles.deleteLevel({ id: level.id });
		await admin.studyCycles.deleteCycle({ id: cycle.id });
		const refreshed = await admin.studyCycles.listCycles({
			facultyId: faculty.id,
		});
		expect(refreshed.items.length).toBe(0);
	});
});
