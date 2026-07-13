import { describe, expect, it, test } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	createClass,
	createStudent,
	makeTestContext,
} from "../../../lib/test-utils";

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
			code: "B-CLS",
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

describe("classes.listPaged", () => {
	test("returns { items, total, pageCount }", async () => {
		const caller = createCaller(asAdmin());
		const result = await caller.classes.listPaged({ page: 1, pageSize: 25 });
		expect(result).toMatchObject({
			items: expect.any(Array),
			total: expect.any(Number),
			pageCount: expect.any(Number),
		});
	});
});
