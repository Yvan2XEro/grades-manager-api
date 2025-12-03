import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("semesters router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.semesters.list()).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("lists semesters for authenticated users", async () => {
		const caller = createCaller(asAdmin());
		const semesters = await caller.semesters.list();
		expect(Array.isArray(semesters)).toBe(true);
		expect(semesters.length).toBeGreaterThanOrEqual(1);
		expect(semesters[0]).toHaveProperty("code");
	});
});
