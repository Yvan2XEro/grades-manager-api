import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
	superAdminProcedure,
} from "../../lib/trpc";
import * as service from "./academic-years.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	setActiveSchema,
	updateSchema,
} from "./academic-years.zod";

export const router = createRouter({
	create: adminProcedure.input(baseSchema).mutation(({ ctx, input }) =>
		service.createAcademicYear(
			{
				...input,
				startDate: input.startDate.toISOString(),
				endDate: input.endDate.toISOString(),
			},
			ctx.institution.id,
		),
	),
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) =>
		service.updateAcademicYear(input.id, ctx.institution.id, {
			...input,
			startDate: input.startDate?.toISOString(),
			endDate: input.endDate?.toISOString(),
		}),
	),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteAcademicYear(input.id, ctx.institution.id),
		),
	setActive: superAdminProcedure
		.input(setActiveSchema)
		.mutation(({ ctx, input }) =>
			service.setActive(input.id, input.isActive, ctx.institution.id),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listAcademicYears(input, ctx.institution.id),
		),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getAcademicYearById(input.id, ctx.institution.id),
		),
});
