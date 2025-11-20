import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	asAdmin,
	asSuperAdmin,
	makeTestContext,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("faculties router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.faculties.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("enforces roles", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(
			caller.faculties.create({ name: "F1" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("supports CRUD", async () => {
		const admin = createCaller(asAdmin());
		const faculty = await admin.faculties.create({ name: "Science" });
		expect(faculty.id).toBeTruthy();

		const fetched = await admin.faculties.getById({ id: faculty.id });
		expect(fetched.name).toBe("Science");

		const updated = await admin.faculties.update({
			id: faculty.id,
			name: "Sci",
		});
		expect(updated.name).toBe("Sci");

		const list = await admin.faculties.list({ limit: 1 });
		expect(list.items.length).toBe(1);

		const superCaller = createCaller(asSuperAdmin());
		await superCaller.faculties.delete({ id: faculty.id });
		const after = await superCaller.faculties.list({});
		// Seed data includes a default faculty, so just ensure the created
		// faculty is gone rather than expecting an empty list.
		expect(after.items.some((f) => f.id === faculty.id)).toBe(false);
	});
});
