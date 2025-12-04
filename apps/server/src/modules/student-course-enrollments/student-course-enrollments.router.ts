import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./student-course-enrollments.service";
import {
	autoEnrollClassSchema,
	bulkSchema,
	closeSchema,
	createSchema,
	idSchema,
	listSchema,
	updateStatusSchema,
} from "./student-course-enrollments.zod";

export const studentCourseEnrollmentsRouter = router({
	create: adminProcedure
		.input(createSchema)
		.mutation(({ input }) => service.createEnrollment(input)),
	bulkEnroll: adminProcedure
		.input(bulkSchema)
		.mutation(({ input }) => service.bulkEnroll(input)),
	updateStatus: adminProcedure
		.input(updateStatusSchema)
		.mutation(({ input }) => service.updateStatus(input.id, input.status)),
	autoEnrollClass: adminProcedure
		.input(autoEnrollClassSchema)
		.mutation(({ input }) => service.autoEnrollClass(input)),
	closeForStudent: adminProcedure
		.input(closeSchema)
		.mutation(({ input }) => service.closeForStudent(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getById(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.list(input)),
});
