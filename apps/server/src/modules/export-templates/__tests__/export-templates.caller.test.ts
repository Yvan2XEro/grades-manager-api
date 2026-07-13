import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { asAdmin } from "@/lib/test-utils";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("exportTemplates.listPaged", () => {
	it("returns { items, total, pageCount }", async () => {
		const caller = createCaller(asAdmin());
		const result = await caller.exportTemplates.listPaged({
			page: 1,
			pageSize: 25,
		});
		expect(result).toMatchObject({
			items: expect.any(Array),
			total: expect.any(Number),
			pageCount: expect.any(Number),
		});
	});
});
