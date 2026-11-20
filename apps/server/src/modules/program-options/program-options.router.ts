import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./program-options.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./program-options.zod";

export const programOptionsRouter = router({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ input, ctx }) =>
			service.createOption(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ input, ctx }) =>
			service.updateOption(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteOption(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.listOptions(input, ctx.institution.id)),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ input, ctx }) =>
			service.searchProgramOptions(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getOptionById(input.id, ctx.institution.id),
		),
});
