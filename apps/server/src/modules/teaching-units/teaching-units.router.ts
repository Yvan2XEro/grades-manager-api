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
		.mutation(({ input, ctx }) =>
			service.createUnit(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input, ctx }) =>
			service.updateUnit(input.id, ctx.institution.id, input),
		),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteUnit(input.id, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getUnitById(input.id, ctx.institution.id),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.listUnits(input, ctx.institution.id)),
});
