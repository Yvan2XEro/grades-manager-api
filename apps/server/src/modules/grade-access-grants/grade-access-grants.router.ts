import { z } from "zod";
import { router, tenantAdminProcedure } from "@/lib/trpc";
import * as service from "./grade-access-grants.service";

export const gradeAccessGrantsRouter = router({
	list: tenantAdminProcedure.query(({ ctx }) =>
		service.listGrants(ctx.institution.id),
	),

	grant: tenantAdminProcedure
		.input(z.object({ profileId: z.string() }))
		.mutation(({ ctx, input }) =>
			service.grantAccess({
				profileId: input.profileId,
				institution: ctx.institution,
				grantedByProfileId: ctx.profile?.id ?? null,
			}),
		),

	revoke: tenantAdminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			service.revokeAccess({
				id: input.id,
				institutionId: ctx.institution.id,
			}),
		),
});
