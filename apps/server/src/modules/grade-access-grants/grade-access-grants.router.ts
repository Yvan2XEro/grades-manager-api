import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";
import * as service from "./grade-access-grants.service";

export const gradeAccessGrantsRouter = router({
	list: adminProcedure.query(({ ctx }) =>
		service.listGrants(ctx.institution.id),
	),

	grant: adminProcedure
		.input(z.object({ profileId: z.string() }))
		.mutation(({ ctx, input }) =>
			service.grantAccess({
				profileId: input.profileId,
				institutionId: ctx.institution.id,
				grantedByProfileId: ctx.profile?.id ?? null,
			}),
		),

	revoke: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			service.revokeAccess({
				id: input.id,
				institutionId: ctx.institution.id,
			}),
		),
});
