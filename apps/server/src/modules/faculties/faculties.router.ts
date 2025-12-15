import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
	superAdminProcedure,
} from "../../lib/trpc";
import * as service from "./faculties.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./faculties.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createFaculty(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateFaculty(input.id, ctx.institution.id, input),
		),
	delete: superAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteFaculty(input.id, ctx.institution.id),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listFaculties(input, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getFacultyById(input.id, ctx.institution.id),
		),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getFacultyByCode(input.code, ctx.institution.id),
		),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchFaculties(input, ctx.institution.id),
		),
});
