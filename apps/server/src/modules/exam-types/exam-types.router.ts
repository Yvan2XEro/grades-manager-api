import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./exam-types.service";
import {
	baseSchema,
	idSchema,
	listPagedSchema,
	listSchema,
	updateSchema,
} from "./exam-types.zod";

export const examTypesRouter = router({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createExamType(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateExamType(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteExamType(input.id, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getExamTypeById(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listExamTypes(input, ctx.institution.id),
		),
	listPaged: tenantProtectedProcedure
		.input(listPagedSchema)
		.query(({ ctx, input }) =>
			service.listExamTypesPaged(input, ctx.institution.id),
		),
});
