import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin, createProgram, makeTestContext } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("teaching units router", () => {
	it("requires auth for list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.teachingUnits.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("allows admin CRUD", async () => {
		const program = await createProgram();
		const admin = createCaller(asAdmin());
		const unit = await admin.teachingUnits.create({
			name: "UE Test",
			code: "UE-T",
			programId: program.id,
			semester: "annual",
			credits: 6,
		});
		expect(unit.programId).toBe(program.id);

		const fetched = await admin.teachingUnits.getById({ id: unit.id });
		expect(fetched?.id).toBe(unit.id);

		const listed = await admin.teachingUnits.list({ programId: program.id });
		expect(listed.items.length).toBeGreaterThan(0);

		const updated = await admin.teachingUnits.update({
			id: unit.id,
			name: "UE Updated",
		});
		expect(updated?.name).toBe("UE Updated");

		await admin.teachingUnits.delete({ id: unit.id });
		const after = await admin.teachingUnits.list({ programId: program.id });
		expect(after.items.find((u) => u.id === unit.id)).toBeUndefined();
	});
});
