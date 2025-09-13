import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./courses.service";
import {
	assignSchema,
	baseSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./courses.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createCourse(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateCourse(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteCourse(input.id)),
	assignDefaultTeacher: adminProcedure
		.input(assignSchema)
		.mutation(({ input }) =>
			service.assignDefaultTeacher(input.courseId, input.teacherId),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listCourses(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getCourseById(input.id)),
});
