import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
	superAdminProcedure,
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

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createCycleLevel(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateCycleLevel(input.id, input)),
	delete: superAdminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteCycleLevel(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listCycleLevels(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getCycleLevelById(input.id)),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ input }) =>
			service.getCycleLevelByCode(input.code, input.cycleId),
		),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ input }) => service.searchCycleLevels(input)),
});
