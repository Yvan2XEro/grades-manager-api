import { APIError, getSessionFromCtx } from "better-auth/api";
import { and, eq, or } from "drizzle-orm";
import { type MemberRole, roleSatisfies } from "@/modules/authz";
import { db } from "../db";
import * as schema from "../db/schema/auth";
import { organizationRoleNames } from "./organization-roles";

/**
 * Better-Auth organization endpoints that hand out or take away a role.
 * The plugin only protects the creator role ("owner"): without this guard an
 * administrator could promote anyone (themselves included) to super_admin or
 * demote/remove a super admin through `/api/auth/organization/*`.
 */
export const ROLE_CHANGING_ORG_PATHS = new Set([
	"/organization/update-member-role",
	"/organization/invite-member",
	"/organization/remove-member",
]);

const knownRoles = new Set<string>(organizationRoleNames);

const splitRoles = (value: unknown): string[] => {
	const raw = Array.isArray(value) ? value : value ? [value] : [];
	return raw
		.flatMap((role) => String(role).split(","))
		.map((role) => role.trim())
		.filter(Boolean);
};

/**
 * An actor may only grant roles they hold (directly or through the hierarchy)
 * and only change/remove members whose roles they hold too.
 * Returns the reason of the refusal, or null when allowed.
 */
export function checkOrgRoleChange(params: {
	actorRole: string | null | undefined;
	requestedRoles: string[];
	targetRoles: string[];
}): string | null {
	const actorRoles = splitRoles(params.actorRole) as MemberRole[];
	const holds = (role: string) =>
		!knownRoles.has(role) ||
		actorRoles.some((actor) => roleSatisfies(actor, [role as MemberRole]));
	if (actorRoles.length === 0) return "Organization membership required";
	if (!params.requestedRoles.every(holds)) {
		return "You cannot assign a role above your own";
	}
	if (!params.targetRoles.every(holds)) {
		return "You cannot manage a member whose role is above your own";
	}
	return null;
}

type HookContext = Parameters<typeof getSessionFromCtx>[0] & {
	path: string;
	body?: Record<string, unknown>;
};

export async function guardOrgRoleChanges(ctx: HookContext) {
	if (!ROLE_CHANGING_ORG_PATHS.has(ctx.path)) return;
	const session = await getSessionFromCtx(ctx);
	// Unauthenticated calls are rejected by the endpoint itself.
	if (!session) return;
	const body = (ctx.body ?? {}) as Record<string, unknown>;
	const organizationId =
		(body.organizationId as string | undefined) ??
		(session.session as { activeOrganizationId?: string | null })
			.activeOrganizationId ??
		null;
	if (!organizationId) return;

	const [actor] = await db
		.select({ role: schema.member.role })
		.from(schema.member)
		.where(
			and(
				eq(schema.member.organizationId, organizationId),
				eq(schema.member.userId, session.user.id),
			),
		)
		.limit(1);

	const targetRef =
		(body.memberId as string | undefined) ??
		(body.memberIdOrEmail as string | undefined);
	let targetRoles: string[] = [];
	if (targetRef) {
		const [target] = await db
			.select({ role: schema.member.role })
			.from(schema.member)
			.innerJoin(schema.user, eq(schema.user.id, schema.member.userId))
			.where(
				and(
					eq(schema.member.organizationId, organizationId),
					or(eq(schema.member.id, targetRef), eq(schema.user.email, targetRef)),
				),
			)
			.limit(1);
		targetRoles = splitRoles(target?.role);
	}

	const refusal = checkOrgRoleChange({
		actorRole: actor?.role,
		requestedRoles: splitRoles(body.role),
		targetRoles,
	});
	if (refusal) {
		throw new APIError("FORBIDDEN", { message: refusal });
	}
}
