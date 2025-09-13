import { describe, expect, it } from "bun:test";
import { createCallerFactory } from "@trpc/server";
import {
	asAdmin,
	asSuperAdmin,
	makeTestContext,
} from "../../../lib/test-utils";
import { appRouter } from "../../../routers";

const createCaller = createCallerFactory(appRouter);

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
