import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { Context as HonoContext } from "hono";
import { db } from "@/db";
import * as appSchema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { buildPermissions, type MemberRole } from "../modules/authz";
import { domainUsersRepo } from "../modules/domain-users";
import { auth } from "./auth";
import { organizationRoleNames } from "./organization-roles";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	let profile = null;
	if (session?.user?.id) {
		profile = await domainUsersRepo.findByAuthUserId(session.user.id);
		if (!profile) {
			profile = await domainUsersRepo.create({
				authUserId: session.user.id,
				businessRole: "student",
				primaryEmail: session.user.email,
				firstName: session.user.name,
				lastName: "",
			});
		}
	}
	const tenant = await resolveTenantContext(session, profile);
	const memberRole = deriveMemberRole(tenant.member?.role);
	return {
		session,
		profile,
		member: tenant.member,
		memberRole,
		permissions: buildPermissions(memberRole),
		institution: tenant.institution,
		organizationId: tenant.organizationId,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Resolves the tenant context from the Better Auth session.
 * Requires an active organization to be set - rejects requests without one.
 * This enforces proper multi-tenant isolation.
 */
async function resolveTenantContext(
	session: Awaited<ReturnType<typeof auth.api.getSession>>,
	profile: appSchema.DomainUser | null,
) {
	// First, try to get organizationId from the active organization in session
	let organizationId = session?.session?.activeOrganizationId ?? null;
	let memberRecord: Awaited<
		ReturnType<typeof db.query.member.findFirst>
	> | null = null;

	// If we know the organization, find the membership for the current user
	if (organizationId && session?.user?.id) {
		memberRecord = await db.query.member.findFirst({
			where: and(
				eq(authSchema.member.organizationId, organizationId),
				eq(authSchema.member.userId, session.user.id),
			),
		});
	}

	// Otherwise fall back to the linked member on the domain profile
	if (!memberRecord && profile?.memberId) {
		memberRecord = await db.query.member.findFirst({
			where: eq(authSchema.member.id, profile.memberId),
		});
		if (!organizationId) {
			organizationId = memberRecord?.organizationId ?? null;
		}
	}

	// Reject requests without an active organization
	if (!organizationId) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				"No active organization. Please set an active organization before making requests.",
		});
	}

	if (!memberRecord) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"Organization membership required. Join the organization before accessing resources.",
		});
	}

	if (memberRecord.organizationId !== organizationId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Active organization mismatch for the current membership.",
		});
	}

	// Lookup the institution for this organization
	const institution = await db.query.institutions.findFirst({
		where: eq(appSchema.institutions.organizationId, organizationId),
	});

	if (!institution) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Institution not found for organization ${organizationId}`,
		});
	}

	return {
		institution,
		organizationId,
		member: memberRecord,
	};
}

function deriveMemberRole(role: string | null | undefined): MemberRole | null {
	if (!role) return null;
	if (
		!organizationRoleNames.includes(
			role as (typeof organizationRoleNames)[number],
		)
	) {
		return null;
	}
	if (role === "owner") return "owner";
	return role as MemberRole;
}
