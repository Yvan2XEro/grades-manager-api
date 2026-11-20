import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./courses.service";
import {
	assignSchema,
	baseSchema,
	codeSchema,
	idSchema,
	listPagedSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./courses.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ input, ctx }) =>
			service.createCourse(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ input, ctx }) =>
			service.updateCourse(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteCourse(input.id, ctx.institution.id),
		),
	assignDefaultTeacher: tenantAdminProcedure
		.input(assignSchema)
		.mutation(({ input, ctx }) =>
			service.assignDefaultTeacher(
				input.courseId,
				ctx.institution.id,
				input.teacherId,
			),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.listCourses(input, ctx.institution.id)),
	listPaged: tenantProtectedProcedure
		.input(listPagedSchema)
		.query(({ ctx, input }) =>
			service.listCoursesPaged(input, ctx.institution.id),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ input, ctx }) =>
			service.searchCourses(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getCourseById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ input, ctx }) =>
			service.getCourseByCode(input.code, input.programId, ctx.institution.id),
		),
});
