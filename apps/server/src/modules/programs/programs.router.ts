import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./programs.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./programs.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createProgram(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateProgram(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteProgram(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listPrograms(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getProgramById(input.id)),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ input }) =>
			service.getProgramByCode(input.code, input.facultyId),
		),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ input }) => service.searchPrograms(input)),
});
