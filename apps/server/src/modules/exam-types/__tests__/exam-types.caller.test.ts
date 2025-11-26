import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("exam types router", () => {
	it("requires authentication for reads", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.examTypes.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("enforces admin role for mutations", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(
			caller.examTypes.create({ name: "CC" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("supports CRUD operations", async () => {
		const admin = createCaller(asAdmin());
		const created = await admin.examTypes.create({
			name: "CC",
			description: "Contrôle continu",
		});
		expect(created.name).toBe("CC");

		const fetched = await admin.examTypes.getById({ id: created.id });
		expect(fetched?.id).toBe(created.id);

		const listed = await admin.examTypes.list({ limit: 1 });
		expect(listed.items.length).toBeGreaterThan(0);

		const updated = await admin.examTypes.update({
			id: created.id,
			description: "CC1",
		});
		expect(updated?.description).toBe("CC1");

		await admin.examTypes.delete({ id: created.id });
		const after = await admin.examTypes.list({});
		expect(after.items.some((item) => item.id === created.id)).toBe(false);
	});
});
