import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./study-cycles.service";
import {
	cycleBaseSchema,
	cycleListSchema,
	idSchema,
	levelBaseSchema,
	levelListSchema,
	listCyclesPagedSchema,
	updateCycleSchema,
	updateLevelSchema,
} from "./study-cycles.zod";

export const studyCyclesRouter = router({
	createCycle: tenantAdminProcedure
		.input(cycleBaseSchema)
		.mutation(({ ctx, input }) =>
			service.createCycle(input, ctx.institution.id),
		),
	updateCycle: tenantAdminProcedure
		.input(updateCycleSchema)
		.mutation(({ ctx, input }) =>
			service.updateCycle(input.id, ctx.institution.id, input),
		),
	deleteCycle: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteCycle(input.id, ctx.institution.id),
		),
	listCycles: tenantProtectedProcedure
		.input(cycleListSchema)
		.query(({ ctx, input }) => service.listCycles(input, ctx.institution.id)),
	listPaged: tenantProtectedProcedure
		.input(listCyclesPagedSchema)
		.query(({ ctx, input }) =>
			service.listCyclesPaged(input, ctx.institution.id),
		),
	getCycle: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getCycleById(input.id, ctx.institution.id),
		),
	createLevel: tenantAdminProcedure
		.input(levelBaseSchema)
		.mutation(({ ctx, input }) =>
			service.createLevel(input, ctx.institution.id),
		),
	updateLevel: tenantAdminProcedure
		.input(updateLevelSchema)
		.mutation(({ ctx, input }) =>
			service.updateLevel(input.id, ctx.institution.id, input),
		),
	deleteLevel: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteLevel(input.id, ctx.institution.id),
		),
	listLevels: tenantProtectedProcedure
		.input(levelListSchema)
		.query(({ ctx, input }) =>
			service.listLevels(input.cycleId, ctx.institution.id),
		),
	getLevel: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getLevelById(input.id, ctx.institution.id),
		),
});
