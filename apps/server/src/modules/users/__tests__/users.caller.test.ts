import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { Context } from "@/lib/context";
import { asAdmin, createUser, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("users router", () => {
	it("requires authentication", async () => {
		const caller = createCaller(makeTestContext());
		await expect(
			caller.users.list({ limit: 1 }),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	it("lists users with cursor pagination", async () => {
		const role = `TESTER-${randomUUID()}`;
		const firstUser = await createUser({
			email: `first-${randomUUID()}@example.com`,
			role,
		});
		const secondUser = await createUser({
			email: `second-${randomUUID()}@example.com`,
			role,
		});
		const sortedIds = [firstUser.id, secondUser.id].sort();

		const admin = createCaller(asAdmin());
		const firstPage = await admin.users.list({ limit: 1, role });
		expect(firstPage.items.length).toBe(1);
		expect(firstPage.items[0].id).toBe(sortedIds[0]);
		expect(firstPage.nextCursor).toBeDefined();

		const secondPage = await admin.users.list({
			limit: 1,
			role,
			cursor: sortedIds[0],
		});
		expect(secondPage.items.length).toBe(1);
		expect(secondPage.items[0].id).toBe(sortedIds[1]);
	});
});
