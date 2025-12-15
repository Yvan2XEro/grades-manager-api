import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./class-courses.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./class-courses.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createClassCourse(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateClassCourse(input.id, input, ctx.institution.id),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteClassCourse(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listClassCourses(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseByCode(
				input.code,
				input.academicYearId,
				ctx.institution.id,
			),
		),
	roster: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassCourseRoster(input.id, ctx.institution.id),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchClassCourses(input, ctx.institution.id),
		),
});
