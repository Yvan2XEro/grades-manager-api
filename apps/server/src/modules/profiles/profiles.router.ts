import { router, tenantProtectedProcedure } from "@/lib/trpc";
import * as service from "./profiles.service";
import { profileIdSchema, profileResultsSchema } from "./profiles.zod";

export const profilesRouter = router({
	get: tenantProtectedProcedure
		.input(profileIdSchema)
		.query(({ ctx, input }) => service.getProfile(input.profileId, ctx)),

	enrollments: tenantProtectedProcedure
		.input(profileIdSchema)
		.query(({ ctx, input }) => service.getEnrollments(input.profileId, ctx)),

	results: tenantProtectedProcedure
		.input(profileResultsSchema)
		.query(({ ctx, input }) =>
			service.getResults(input.profileId, ctx, input.academicYearId),
		),

	finances: tenantProtectedProcedure
		.input(profileIdSchema)
		.query(({ ctx, input }) => service.getFinances(input.profileId, ctx)),

	guardians: tenantProtectedProcedure
		.input(profileIdSchema)
		.query(({ ctx, input }) => service.getGuardians(input.profileId, ctx)),
});
