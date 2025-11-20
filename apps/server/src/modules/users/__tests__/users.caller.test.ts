import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { Context } from "@/lib/context";
import { asAdmin, createUser, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("users router", () => {
	it("requires authentication", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.users.list({ limit: 1 })).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("lists users with cursor pagination", async () => {
		const role = "teacher";
		const firstUser = await createUser({
			email: `first-${randomUUID()}@example.com`,
			businessRole: role,
		});
		const secondUser = await createUser({
			email: `second-${randomUUID()}@example.com`,
			businessRole: role,
		});
		const createdIds = new Set([firstUser.profile.id, secondUser.profile.id]);

		const admin = createCaller(asAdmin());
		const firstPage = await admin.users.list({ limit: 1, role });
		expect(firstPage.items.length).toBe(1);
		expect(createdIds.has(firstPage.items[0].profileId)).toBe(true);
		createdIds.delete(firstPage.items[0].profileId);
		expect(firstPage.nextCursor).toBeDefined();

		const secondPage = await admin.users.list({
			limit: 1,
			role,
			cursor: firstPage.nextCursor,
		});
		expect(secondPage.items.length).toBe(1);
		expect(createdIds.has(secondPage.items[0].profileId)).toBe(true);
		createdIds.delete(secondPage.items[0].profileId);
		expect(createdIds.size).toBe(0);
	});
});
