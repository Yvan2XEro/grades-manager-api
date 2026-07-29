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

type SessionWithActiveOrganization = {
	activeOrganizationId?: string | null;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const orgSlugHint =
		context.req.raw.headers.get("X-Organization-Slug") ?? undefined;
	const tenant = await resolveTenantContext(session, orgSlugHint);
	let profile = null;
	if (tenant.member) {
		profile = await domainUsersRepo.findByMemberId(tenant.member.id);
		if (!profile && session?.user) {
			profile = await domainUsersRepo.create({
				memberId: tenant.member.id,
				primaryEmail: session.user.email,
				firstName: session.user.name,
				lastName: "",
			});
		}
	}
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
	orgSlugHint?: string,
) {
	const authSession = session?.session as
		| SessionWithActiveOrganization
		| undefined;
	// First, try to get organizationId from the active organization in session
	let organizationId = authSession?.activeOrganizationId ?? null;
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

	// Fallback: resolve via the X-Organization-Slug header sent by the client.
	// When a session exists, we also resolve membership.
	if (!organizationId && orgSlugHint) {
		const org = await db
			.select({ id: authSchema.organization.id })
			.from(authSchema.organization)
			.where(eq(authSchema.organization.slug, orgSlugHint))
			.limit(1)
			.then((rows) => rows[0]);
		if (org) {
			organizationId = org.id;
			// Only look up membership when the user is authenticated.
			if (session?.user?.id) {
				const [member] = await db
					.select()
					.from(authSchema.member)
					.where(
						and(
							eq(authSchema.member.organizationId, org.id),
							eq(authSchema.member.userId, session.user.id),
						),
					)
					.limit(1);
				if (member) memberRecord = member;
			}
		}
	}

	// Reject requests without any resolvable organization context.
	if (!organizationId) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				"No active organization. Please set an active organization before making requests.",
		});
	}

	// Authenticated requests must have a valid membership record.
	if (session?.user?.id && !memberRecord) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"Organization membership required. Join the organization before accessing resources.",
		});
	}

	if (memberRecord && memberRecord.organizationId !== organizationId) {
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
