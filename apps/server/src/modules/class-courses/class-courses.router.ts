import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./class-courses.service";
import {
	baseSchema,
	codeSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./class-courses.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createClassCourse(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateClassCourse(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteClassCourse(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listClassCourses(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getClassCourseById(input.id)),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ input }) =>
			service.getClassCourseByCode(input.code, input.academicYearId),
		),
	roster: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getClassCourseRoster(input.id)),
});
