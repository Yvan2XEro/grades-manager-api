import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./study-cycles.service";
import {
	cycleBaseSchema,
	cycleListSchema,
	idSchema,
	levelBaseSchema,
	levelListSchema,
	updateCycleSchema,
	updateLevelSchema,
} from "./study-cycles.zod";

export const studyCyclesRouter = router({
	createCycle: adminProcedure
		.input(cycleBaseSchema)
		.mutation(({ ctx, input }) =>
			service.createCycle(input, ctx.institution.id),
		),
	updateCycle: adminProcedure
		.input(updateCycleSchema)
		.mutation(({ ctx, input }) =>
			service.updateCycle(input.id, ctx.institution.id, input),
		),
	deleteCycle: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteCycle(input.id, ctx.institution.id),
		),
	listCycles: protectedProcedure
		.input(cycleListSchema)
		.query(({ ctx, input }) => service.listCycles(input, ctx.institution.id)),
	getCycle: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getCycleById(input.id, ctx.institution.id),
		),
	createLevel: adminProcedure
		.input(levelBaseSchema)
		.mutation(({ ctx, input }) =>
			service.createLevel(input, ctx.institution.id),
		),
	updateLevel: adminProcedure
		.input(updateLevelSchema)
		.mutation(({ ctx, input }) =>
			service.updateLevel(input.id, ctx.institution.id, input),
		),
	deleteLevel: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteLevel(input.id, ctx.institution.id),
		),
	listLevels: protectedProcedure
		.input(levelListSchema)
		.query(({ ctx, input }) =>
			service.listLevels(input.cycleId, ctx.institution.id),
		),
	getLevel: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getLevelById(input.id, ctx.institution.id),
		),
});
