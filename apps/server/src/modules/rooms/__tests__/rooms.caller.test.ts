import { describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import { setTestInstitution } from "../../../lib/test-context-state";
import {
	asAdmin,
	makeTestContext,
	setupTestInstitution,
} from "../../../lib/test-utils";

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("rooms router", () => {
	it("requires auth for list", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.rooms.list({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("requires admin role for create", async () => {
		const caller = createCaller(makeTestContext({ role: "student" }));
		await expect(
			caller.rooms.create({ code: "AMPHI", name: "Amphi A" }),
		).rejects.toHaveProperty("code", "FORBIDDEN");
	});

	it("creates and lists a room", async () => {
		const admin = createCaller(asAdmin());

		const room = await admin.rooms.create({
			code: "AMPHI-A",
			name: "Amphi A",
			capacity: 200,
		});

		expect(room.name).toBe("Amphi A");
		expect(room.capacity).toBe(200);
		expect(room.isActive).toBe(true);

		const list = await admin.rooms.list({});
		expect(list.some((r) => r.id === room.id)).toBe(true);
	});

	it("updates room properties", async () => {
		const admin = createCaller(asAdmin());

		const room = await admin.rooms.create({
			code: "SALLE-101",
			name: "Salle 101",
			capacity: 30,
		});
		const updated = await admin.rooms.update({
			id: room.id,
			capacity: 45,
			isActive: false,
		});

		expect(updated.capacity).toBe(45);
		expect(updated.isActive).toBe(false);
	});

	it("deletes a room", async () => {
		const admin = createCaller(asAdmin());

		const room = await admin.rooms.create({
			code: "SALLE-202",
			name: "Salle 202",
		});
		await admin.rooms.delete({ id: room.id });

		const list = await admin.rooms.list({});
		expect(list.some((r) => r.id === room.id)).toBe(false);
	});

	it("is institution-scoped — cannot see other institution rooms", async () => {
		// Set up institution 1 and create a room in it
		const inst1 = await setupTestInstitution();
		setTestInstitution(inst1);
		const admin1 = createCaller(asAdmin());
		const room1 = await admin1.rooms.create({
			code: "INST1-R1",
			name: "Salle INST1",
		});

		// Switch to institution 2 — room1 must not appear
		const inst2 = await setupTestInstitution();
		setTestInstitution(inst2);
		const admin2 = createCaller(asAdmin());
		const list2 = await admin2.rooms.list({});
		expect(list2.every((r) => r.id !== room1.id)).toBe(true);

		// Restore original institution (last setupTestInstitution already set it)
	});

	it("teacher role can list rooms", async () => {
		const teacher = createCaller(makeTestContext({ role: "teacher" }));
		const list = await teacher.rooms.list({});
		expect(Array.isArray(list)).toBe(true);
	});
});
