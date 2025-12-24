import { TRPCError } from "@trpc/server";
import type { Institution } from "@/db/schema/app-schema";
import type { Context } from "./context";

type TenantSource =
	| Pick<Context, "institution">
	| { institution: Institution | null };

export function requireInstitution(ctx: TenantSource): Institution {
	if (!ctx.institution) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Institution context is missing",
		});
	}
	return ctx.institution;
}

export function getInstitutionId(ctx: TenantSource): string {
	return requireInstitution(ctx).id;
}
