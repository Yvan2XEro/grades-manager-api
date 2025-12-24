import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, createFaculty, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("programs router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.programs.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("supports CRUD", async () => {
		const admin = createCaller(asAdmin());
		const program = await admin.programs.create({
			name: "Prog",
			code: "PRG-1",
		});
		expect(program.code).toBe("PRG-1");

		const list = await admin.programs.list({});
		expect(list.items.some((p) => p.id === program.id)).toBe(true);

		const updated = await admin.programs.update({
			id: program.id,
			name: "Prog2",
		});
		expect(updated.name).toBe("Prog2");

		await admin.programs.delete({ id: program.id });
		const after = await admin.programs.list({});
		expect(after.items.find((p) => p.id === program.id)).toBeUndefined();
	});
});
