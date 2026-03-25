import { router, tenantAdminProcedure } from "@/lib/trpc";
import * as service from "./diplomation-keys.service";
import {
	createKeySchema,
	revokeKeySchema,
	updateWebhookSchema,
} from "./diplomation-keys.zod";

export const diplomationKeysRouter = router({
	create: tenantAdminProcedure
		.input(createKeySchema)
		.mutation(async ({ ctx, input }) => {
			return service.createKey(input, ctx.institution.id);
		}),

	list: tenantAdminProcedure.query(async ({ ctx }) => {
		return service.listKeys(ctx.institution.id);
	}),

	revoke: tenantAdminProcedure
		.input(revokeKeySchema)
		.mutation(async ({ ctx, input }) => {
			return service.revokeKey(input, ctx.institution.id);
		}),

	updateWebhook: tenantAdminProcedure
		.input(updateWebhookSchema)
		.mutation(async ({ ctx, input }) => {
			return service.updateWebhook(input, ctx.institution.id);
		}),
});
