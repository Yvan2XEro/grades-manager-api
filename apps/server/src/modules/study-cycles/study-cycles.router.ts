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
		.mutation(({ input }) => service.createCycle(input)),
	updateCycle: adminProcedure
		.input(updateCycleSchema)
		.mutation(({ input }) => service.updateCycle(input.id, input)),
	deleteCycle: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteCycle(input.id)),
	listCycles: protectedProcedure
		.input(cycleListSchema)
		.query(({ input }) => service.listCycles(input)),
	getCycle: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getCycleById(input.id)),
	createLevel: adminProcedure
		.input(levelBaseSchema)
		.mutation(({ input }) => service.createLevel(input)),
	updateLevel: adminProcedure
		.input(updateLevelSchema)
		.mutation(({ input }) => service.updateLevel(input.id, input)),
	deleteLevel: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteLevel(input.id)),
	listLevels: protectedProcedure
		.input(levelListSchema)
		.query(({ input }) => service.listLevels(input.cycleId)),
	getLevel: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getLevelById(input.id)),
});
