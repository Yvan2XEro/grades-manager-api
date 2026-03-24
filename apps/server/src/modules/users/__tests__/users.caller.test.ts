import { describe, expect, it, mock } from "bun:test";
import { randomUUID } from "node:crypto";
import type { Context } from "@/lib/context";
import { auth as testAuth, db as testDb } from "@/lib/test-db";
import {
	asAdmin,
	asUser,
	createOrganizationMember,
	createUser,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

// Replace the prod auth singleton (which uses a stale empty PGlite loaded at
// preload-time, before the @/db mock takes effect) with the properly-seeded
// test auth that shares the same in-memory PGlite as the rest of the tests.
mock.module("@/lib/auth", () => ({
	auth: testAuth,
	superadminRoles: ["admin"],
	adminRoles: ["admin"],
}));

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

describe("users router", () => {
	it("requires authentication", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.users.list({ limit: 1 })).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
	});

	it("lists users with cursor pagination", async () => {
		const role = "staff";
		const firstUser = await createUser({
			email: `first-${randomUUID()}@example.com`,
			memberRole: role,
		});
		const secondUser = await createUser({
			email: `second-${randomUUID()}@example.com`,
			memberRole: role,
		});
		const createdIds = new Set([firstUser.profile.id, secondUser.profile.id]);

		const admin = createCaller(asAdmin());
		const firstPage = await admin.users.list({ limit: 1, role });
		expect(firstPage.items.length).toBe(1);
		expect(createdIds.has(firstPage.items[0].id)).toBe(true);
		createdIds.delete(firstPage.items[0].id);
		expect(firstPage.nextCursor).toBeDefined();

		const secondPage = await admin.users.list({
			limit: 1,
			role,
			cursor: firstPage.nextCursor,
		});
		expect(secondPage.items.length).toBe(1);
		expect(createdIds.has(secondPage.items[0].id)).toBe(true);
		createdIds.delete(secondPage.items[0].id);
		expect(createdIds.size).toBe(0);
	});

	it("allows admins to link profiles to organization members", async () => {
		const member = await createOrganizationMember();
		const admin = createCaller(asAdmin());
		const created = await admin.users.createProfile({
			firstName: "Org",
			lastName: "Member",
			email: `org-member-${randomUUID()}@example.com`,
			memberId: member.id,
		});
		expect(created?.memberId).toBe(member.id);
	});

	describe("createWithAuth", () => {
		it("rejects non-admin callers", async () => {
			const caller = createCaller(asUser());
			await expect(
				caller.users.createWithAuth({
					firstName: "Test",
					lastName: "User",
					email: `test-${randomUUID()}@example.com`,
					canConnect: false,
				}),
			).rejects.toHaveProperty("code", "FORBIDDEN");
		});

		it("creates a domain-only profile when canConnect=false", async () => {
			const caller = createCaller(asAdmin());
			const result = await caller.users.createWithAuth({
				firstName: "Domain",
				lastName: "Only",
				email: `domain-${randomUUID()}@example.com`,
				canConnect: false,
			});
			expect(result).toBeDefined();
			expect(result?.authUserId).toBeNull();
			expect(result?.memberId).toBeNull();
		});

		it("creates auth user + member + domain profile when canConnect=true", async () => {
			const email = `auth-${randomUUID()}@example.com`;
			const caller = createCaller(asAdmin());
			const result = await caller.users.createWithAuth({
				firstName: "Auth",
				lastName: "User",
				email,
				canConnect: true,
				password: "securepassword123",
				memberRole: "teacher",
			});
			expect(result).toBeDefined();
			expect(result?.authUserId).toBeTruthy();
			expect(result?.memberId).toBeTruthy();
			expect(result?.primaryEmail).toBe(email);
		});

		it("rejects canConnect=true without password", async () => {
			const caller = createCaller(asAdmin());
			await expect(
				caller.users.createWithAuth({
					firstName: "Test",
					lastName: "User",
					email: `test-${randomUUID()}@example.com`,
					canConnect: true,
					memberRole: "teacher",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects canConnect=true without memberRole", async () => {
			const caller = createCaller(asAdmin());
			await expect(
				caller.users.createWithAuth({
					firstName: "Test",
					lastName: "User",
					email: `test-${randomUUID()}@example.com`,
					canConnect: true,
					password: "securepassword123",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects a short password", async () => {
			const caller = createCaller(asAdmin());
			await expect(
				caller.users.createWithAuth({
					firstName: "Test",
					lastName: "User",
					email: `test-${randomUUID()}@example.com`,
					canConnect: true,
					password: "short",
					memberRole: "teacher",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects duplicate email", async () => {
			const email = `dup-${randomUUID()}@example.com`;
			const caller = createCaller(asAdmin());
			await caller.users.createWithAuth({
				firstName: "First",
				lastName: "User",
				email,
				canConnect: true,
				password: "securepassword123",
				memberRole: "teacher",
			});
			await expect(
				caller.users.createWithAuth({
					firstName: "Second",
					lastName: "User",
					email,
					canConnect: true,
					password: "anotherpassword",
					memberRole: "staff",
				}),
			).rejects.toHaveProperty("code", "CONFLICT");
		});
	});
});
