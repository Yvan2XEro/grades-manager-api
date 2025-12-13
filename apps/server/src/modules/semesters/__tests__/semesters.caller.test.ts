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
		const result = await caller.semesters.list();
		expect(result).toHaveProperty("items");
		expect(Array.isArray(result.items)).toBe(true);
		expect(result.items.length).toBeGreaterThanOrEqual(1);
		expect(result.items[0]).toHaveProperty("code");
	});
});
