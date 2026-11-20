import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./teaching-units.service";
import {
	baseSchema,
	idSchema,
	listPagedSchema,
	listSchema,
	updateSchema,
} from "./teaching-units.zod";

export const teachingUnitsRouter = router({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ input, ctx }) =>
			service.createUnit(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ input, ctx }) =>
			service.updateUnit(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteUnit(input.id, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getUnitById(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.listUnits(input, ctx.institution.id)),
	listPaged: tenantProtectedProcedure
		.input(listPagedSchema)
		.query(({ input, ctx }) =>
			service.listUnitsPaged(input, ctx.institution.id),
		),
});
