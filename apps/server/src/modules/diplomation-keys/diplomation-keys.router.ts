import {
	router,
	tenantAdministratorProcedure,
	tenantSuperAdminProcedure,
} from "@/lib/trpc";
import * as repo from "./diplomation-keys.repo";
import * as service from "./diplomation-keys.service";
import {
	activityStatsSchema,
	callStatsSchema,
	createKeySchema,
	revokeKeySchema,
	updateWebhookSchema,
} from "./diplomation-keys.zod";

/**
 * API keys open the deliberation data to an external system: issuing,
 * revoking and pointing webhooks are super admin operations; administrators
 * (not deans) can audit the keys and their activity.
 */
export const diplomationKeysRouter = router({
	create: tenantSuperAdminProcedure
		.input(createKeySchema)
		.mutation(async ({ ctx, input }) => {
			return service.createKey(input, ctx.institution.id);
		}),

	list: tenantAdministratorProcedure.query(async ({ ctx }) => {
		return service.listKeys(ctx.institution.id);
	}),

	revoke: tenantSuperAdminProcedure
		.input(revokeKeySchema)
		.mutation(async ({ ctx, input }) => {
			return service.revokeKey(input, ctx.institution.id);
		}),

	updateWebhook: tenantSuperAdminProcedure
		.input(updateWebhookSchema)
		.mutation(async ({ ctx, input }) => {
			return service.updateWebhook(input, ctx.institution.id);
		}),

	activityStats: tenantAdministratorProcedure
		.input(activityStatsSchema)
		.query(async ({ ctx, input }) => {
			return repo.getActivityStats(ctx.institution.id, input.days);
		}),

	callStats: tenantAdministratorProcedure
		.input(callStatsSchema)
		.query(async ({ ctx, input }) => {
			return repo.getCallStats(ctx.institution.id, input.days);
		}),
});
