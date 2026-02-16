import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./classes.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	transferSchema,
	updateSchema,
} from "./classes.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createClass(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateClass(input.id, input, ctx.institution.id),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteClass(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listClasses(input, ctx.institution.id)),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getClassByCode(
				input.code,
				input.academicYearId,
				ctx.institution.id,
			),
		),
	transferStudent: tenantAdminProcedure
		.input(transferSchema)
		.mutation(({ ctx, input }) =>
			service.transferStudent(
				input.studentId,
				input.toClassId,
				ctx.institution.id,
			),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchClasses(input, ctx.institution.id),
		),
});
