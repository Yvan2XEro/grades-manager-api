import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./registration-numbers.service";
import {
	createFormatSchema,
	idSchema,
	listSchema,
	previewSchema,
	updateFormatSchema,
} from "./registration-numbers.zod";

export const registrationNumbersRouter = router({
	list: tenantAdminProcedure
		.input(listSchema.optional())
		.query(({ ctx, input }) =>
			service.listFormats(input ?? {}, ctx.institution.id),
		),
	getActive: tenantProtectedProcedure.query(({ ctx }) =>
		service.getActiveFormat(ctx.institution.id),
	),
	create: tenantAdminProcedure
		.input(createFormatSchema)
		.mutation(({ ctx, input }) =>
			service.createFormat(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateFormatSchema)
		.mutation(({ ctx, input }) =>
			service.updateFormat(input.id, input, ctx.institution.id),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteFormat(input.id, ctx.institution.id),
		),
	preview: tenantAdminProcedure
		.input(previewSchema)
		.mutation(({ ctx, input }) =>
			service.previewFormat(input, ctx.institution.id),
		),
});
