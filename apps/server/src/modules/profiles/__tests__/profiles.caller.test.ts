import { describe, expect, it } from "bun:test";
import { asAdmin, asSuperAdmin, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("profiles router", () => {
	it("requires admin", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.profiles.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("lists and updates role", async () => {
		const admin = createCaller(asAdmin());
		const list = await admin.profiles.list({});
		expect(list.items.length).toBeGreaterThan(0);

		const profile = list.items[0];
		const superCaller = createCaller(asSuperAdmin());
		const updated = await superCaller.profiles.updateRole({
			profileId: profile.id,
			role: "ADMIN",
		});
		expect(updated.role).toBe("ADMIN");
	});
});
