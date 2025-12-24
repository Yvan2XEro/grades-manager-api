import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./exam-types.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./exam-types.zod";

export const examTypesRouter = router({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createExamType(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateExamType(input.id, ctx.institution.id, input),
		),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteExamType(input.id, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getExamTypeById(input.id, ctx.institution.id),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listExamTypes(input, ctx.institution.id),
		),
});
