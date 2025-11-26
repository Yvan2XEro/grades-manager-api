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
		.mutation(({ input }) => service.createExamType(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateExamType(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteExamType(input.id)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getExamTypeById(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listExamTypes(input)),
});
