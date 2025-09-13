import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
	superAdminProcedure,
} from "../../lib/trpc";
import * as service from "./faculties.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./faculties.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createFaculty(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateFaculty(input.id, input)),
	delete: superAdminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteFaculty(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listFaculties(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getFacultyById(input.id)),
});
