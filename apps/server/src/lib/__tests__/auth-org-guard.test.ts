/**
 * Role ceilings on Better-Auth organization endpoints
 * (`/api/auth/organization/*`), which bypass tRPC entirely.
 */
import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import * as authSchema from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { checkOrgRoleChange } from "@/lib/auth-org-guard";
import { getTestInstitution } from "@/lib/test-context-state";
import { db } from "@/lib/test-db";
import { createUser } from "@/lib/test-utils";

describe("checkOrgRoleChange", () => {
	it("refuses granting a role above the actor's", () => {
		expect(
			checkOrgRoleChange({
				actorRole: "administrator",
				requestedRoles: ["super_admin"],
				targetRoles: ["teacher"],
			}),
		).not.toBeNull();
		expect(
			checkOrgRoleChange({
				actorRole: "dean",
				requestedRoles: ["administrator"],
				targetRoles: ["teacher"],
			}),
		).not.toBeNull();
	});

	it("refuses managing a member above the actor's role", () => {
		expect(
			checkOrgRoleChange({
				actorRole: "administrator",
				requestedRoles: ["teacher"],
				targetRoles: ["super_admin"],
			}),
		).not.toBeNull();
	});

	it("allows changes within the actor's ceiling", () => {
		expect(
			checkOrgRoleChange({
				actorRole: "administrator",
				requestedRoles: ["dean"],
				targetRoles: ["teacher"],
			}),
		).toBeNull();
		expect(
			checkOrgRoleChange({
				actorRole: "super_admin",
				requestedRoles: ["super_admin"],
				targetRoles: ["administrator"],
			}),
		).toBeNull();
	});
});

async function signInHeaders(email: string, password: string) {
	const organizationId = getTestInstitution().organizationId as string;
	const result = await auth.api.signInEmail({
		body: { email, password },
		returnHeaders: true,
	});
	const cookie = result.headers.get("set-cookie") ?? "";
	const headers = new Headers({ cookie: cookie.split(";")[0] });
	await auth.api.setActiveOrganization({ headers, body: { organizationId } });
	return { headers, organizationId };
}

async function memberOf(userId: string, organizationId: string) {
	const [member] = await db
		.select()
		.from(authSchema.member)
		.where(
			and(
				eq(authSchema.member.userId, userId),
				eq(authSchema.member.organizationId, organizationId),
			),
		);
	return member;
}

describe("organization endpoints role ceiling", () => {
	it("an administrator cannot promote anyone (or themselves) to super_admin", async () => {
		const password = "password123";
		const adminEmail = `admin-${randomUUID()}@example.com`;
		const adminUser = await createUser({
			email: adminEmail,
			password,
			memberRole: "administrator",
		});
		const teacher = await createUser({ memberRole: "teacher" });
		const { headers, organizationId } = await signInHeaders(
			adminEmail,
			password,
		);
		const adminMember = await memberOf(adminUser.id, organizationId);
		const teacherMember = await memberOf(teacher.id, organizationId);

		for (const memberId of [adminMember.id, teacherMember.id]) {
			await expect(
				auth.api.updateMemberRole({
					headers,
					body: { memberId, role: "super_admin", organizationId },
				}),
			).rejects.toThrow();
		}
		expect((await memberOf(adminUser.id, organizationId)).role).toBe(
			"administrator",
		);
		expect((await memberOf(teacher.id, organizationId)).role).toBe("teacher");

		await expect(
			auth.api.createInvitation({
				headers,
				body: {
					email: `invitee-${randomUUID()}@example.com`,
					role: "super_admin",
					organizationId,
				},
			}),
		).rejects.toThrow();

		// Within the ceiling the endpoint still works
		await auth.api.updateMemberRole({
			headers,
			body: { memberId: teacherMember.id, role: "dean", organizationId },
		});
		expect((await memberOf(teacher.id, organizationId)).role).toBe("dean");
	});

	it("an administrator cannot demote or remove a super admin", async () => {
		const password = "password123";
		const adminEmail = `admin-${randomUUID()}@example.com`;
		await createUser({
			email: adminEmail,
			password,
			memberRole: "administrator",
		});
		const superAdmin = await createUser({ memberRole: "super_admin" });
		const { headers, organizationId } = await signInHeaders(
			adminEmail,
			password,
		);
		const target = await memberOf(superAdmin.id, organizationId);
		await expect(
			auth.api.updateMemberRole({
				headers,
				body: { memberId: target.id, role: "student", organizationId },
			}),
		).rejects.toThrow();
		await expect(
			auth.api.removeMember({
				headers,
				body: { memberIdOrEmail: target.id, organizationId },
			}),
		).rejects.toThrow();
		expect((await memberOf(superAdmin.id, organizationId))?.role).toBe(
			"super_admin",
		);
	});
});
