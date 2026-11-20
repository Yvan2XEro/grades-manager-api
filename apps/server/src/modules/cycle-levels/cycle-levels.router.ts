import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
	tenantSuperAdminProcedure,
} from "../../lib/trpc";
import * as service from "./cycle-levels.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./cycle-levels.zod";

export const cycleLevelsRouter = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createCycleLevel(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateCycleLevel(input.id, input, ctx.institution.id),
		),
	delete: tenantSuperAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteCycleLevel(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listCycleLevels(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getCycleLevelById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getCycleLevelByCode(
				input.code,
				input.cycleId,
				ctx.institution.id,
			),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchCycleLevels(input, ctx.institution.id),
		),
});
