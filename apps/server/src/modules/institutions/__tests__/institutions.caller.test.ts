import { describe, expect, it } from "bun:test";
import { asAdmin, makeTestContext } from "@/lib/test-utils";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("institutions router", () => {
	it("requires auth to read", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.institutions.get()).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("allows admin to upsert", async () => {
		const admin = createCaller(asAdmin());
		const updated = await admin.institutions.upsert({
			code: "SGN",
			nameFr: "Institut Demo",
			nameEn: "Demo Institute",
			shortName: "SGN",
			addressFr: "Yaoundé",
			addressEn: "Yaounde",
		});
		expect(updated?.code).toBe("SGN");
		const read = await admin.institutions.get();
		expect(read?.nameEn).toBe("Demo Institute");
	});
});
