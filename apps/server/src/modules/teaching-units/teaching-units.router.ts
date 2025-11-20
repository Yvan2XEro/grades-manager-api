import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./teaching-units.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./teaching-units.zod";

export const teachingUnitsRouter = router({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createUnit(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateUnit(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteUnit(input.id)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getUnitById(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listUnits(input)),
});
