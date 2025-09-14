import { describe, expect, it } from "bun:test";
import {
	asAdmin,
	createClass,
	createStudent,
	makeTestContext,
} from "../../../lib/test-utils";
import { appRouter } from "@/routers";
import type { Context } from "@/lib/context";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
describe("classes router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.classes.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("supports CRUD and transfer", async () => {
		const admin = createCaller(asAdmin());
		const cls = await createClass();
		const newCls = await admin.classes.create({
			name: "B",
			program: cls.program,
			academicYear: cls.academicYear,
		});
		const student = await createStudent({ class: cls.id });
		const transferred = await admin.classes.transferStudent({
			studentId: student.id,
			toClassId: newCls.id,
		});
		expect(transferred?.class).toBe(newCls.id);

		await admin.classes.delete({ id: newCls.id });
		const list = await admin.classes.list({ programId: cls.program });
		expect(list.items.length).toBeGreaterThanOrEqual(1);
	});
});
