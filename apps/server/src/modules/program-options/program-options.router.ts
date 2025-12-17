import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./program-options.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./program-options.zod";

export const programOptionsRouter = router({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createOption(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateOption(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteOption(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listOptions(input)),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ input }) => service.searchProgramOptions(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getOptionById(input.id)),
});
