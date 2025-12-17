import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
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
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ input }) => service.createClass(input)),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateClass(input.id, input)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteClass(input.id)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listClasses(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getClassById(input.id)),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ input }) =>
			service.getClassByCode(input.code, input.academicYearId),
		),
	transferStudent: adminProcedure
		.input(transferSchema)
		.mutation(({ input }) =>
			service.transferStudent(input.studentId, input.toClassId),
		),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ input }) => service.searchClasses(input)),
});
