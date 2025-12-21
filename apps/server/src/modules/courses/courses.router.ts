import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./courses.service";
import {
	assignSchema,
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	searchSchema,
	updateSchema,
} from "./courses.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input, ctx }) =>
			service.createCourse(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input, ctx }) =>
			service.updateCourse(input.id, ctx.institution.id, input),
		),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteCourse(input.id, ctx.institution.id),
		),
	assignDefaultTeacher: adminProcedure
		.input(assignSchema)
		.mutation(({ input, ctx }) =>
			service.assignDefaultTeacher(
				input.courseId,
				ctx.institution.id,
				input.teacherId,
			),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input, ctx }) => service.listCourses(input, ctx.institution.id)),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ input, ctx }) =>
			service.searchCourses(input, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getCourseById(input.id, ctx.institution.id),
		),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ input, ctx }) =>
			service.getCourseByCode(input.code, input.programId, ctx.institution.id),
		),
});
