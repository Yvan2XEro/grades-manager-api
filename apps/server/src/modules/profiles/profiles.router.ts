import z from "zod";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import { assignableMemberRoles } from "@/modules/users/users.zod";
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

	// ── Auth account management (admin only) ───────────────────────────────
	getAuthAccount: tenantAdminProcedure
		.input(profileIdSchema)
		.query(({ ctx, input }) => service.getAuthAccount(input.profileId, ctx)),

	createAuthForProfile: tenantAdminProcedure
		.input(
			profileIdSchema.extend({
				email: z.string().email(),
				password: z.string().min(8),
				memberRole: z.enum(
					assignableMemberRoles as unknown as [string, ...string[]],
				),
			}),
		)
		.mutation(({ ctx, input }) =>
			service.createAuthForProfile(
				input.profileId,
				{
					email: input.email,
					password: input.password,
					memberRole: input.memberRole,
				},
				ctx,
			),
		),

	linkAuthAccount: tenantAdminProcedure
		.input(profileIdSchema.extend({ authEmail: z.string().email() }))
		.mutation(({ ctx, input }) =>
			service.linkAuthAccount(input.profileId, input.authEmail, ctx),
		),

	sendPasswordReset: tenantAdminProcedure
		.input(profileIdSchema)
		.mutation(({ ctx, input }) =>
			service.sendPasswordReset(input.profileId, ctx),
		),

	setBanStatus: tenantAdminProcedure
		.input(profileIdSchema.extend({ banned: z.boolean() }))
		.mutation(({ ctx, input }) =>
			service.setBanStatus(input.profileId, input.banned, ctx),
		),
});
