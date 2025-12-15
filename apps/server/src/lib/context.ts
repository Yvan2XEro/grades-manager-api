import { eq } from "drizzle-orm";
import type { Context as HonoContext } from "hono";
import { db } from "@/db";
import * as appSchema from "@/db/schema/app-schema";
import * as authSchema from "@/db/schema/auth";
import { buildPermissions } from "../modules/authz";
import { domainUsersRepo } from "../modules/domain-users";
import { auth } from "./auth";
import { requireDefaultInstitution } from "./institution";

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
	return {
		session,
		profile,
		permissions: buildPermissions(profile),
		institution: tenant.institution,
		organizationId: tenant.organizationId,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;

async function resolveTenantContext(
	session: Awaited<ReturnType<typeof auth.api.getSession>>,
	profile: appSchema.DomainUser | null,
) {
	let organizationId = session?.session?.activeOrganizationId ?? null;
	let memberRecord: Awaited<
		ReturnType<typeof db.query.member.findFirst>
	> | null = null;
	if (!organizationId && profile?.memberId) {
		memberRecord = await db.query.member.findFirst({
			where: eq(authSchema.member.id, profile.memberId),
		});
		organizationId = memberRecord?.organizationId ?? null;
	}

	let institution =
		organizationId === null
			? null
			: await db.query.institutions.findFirst({
					where: eq(appSchema.institutions.organizationId, organizationId),
				});

	if (!institution && profile?.memberId && !memberRecord) {
		memberRecord = await db.query.member.findFirst({
			where: eq(authSchema.member.id, profile.memberId),
		});
		if (memberRecord?.organizationId) {
			organizationId = memberRecord.organizationId;
			institution = await db.query.institutions.findFirst({
				where: eq(
					appSchema.institutions.organizationId,
					memberRecord.organizationId,
				),
			});
		}
	}

	if (!institution) {
		institution = await requireDefaultInstitution();
		if (!organizationId) {
			organizationId = institution.organizationId ?? null;
		}
	}

	return {
		institution,
		organizationId,
	};
}
