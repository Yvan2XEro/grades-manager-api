import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./enrollments.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	statusSchema,
	updateSchema,
} from "./enrollments.zod";

export const enrollmentsRouter = router({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createEnrollment(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateEnrollment(input.id, input)),
	updateStatus: adminProcedure
		.input(statusSchema)
		.mutation(({ input }) => service.updateStatus(input.id, input.status)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getEnrollmentById(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listEnrollments(input)),
});
