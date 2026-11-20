import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
	tenantSuperAdminProcedure,
} from "../../lib/trpc";
import * as service from "./academic-years.service";
import {
	baseSchema,
	createNextYearSchema,
	idSchema,
	listPagedSchema,
	listSchema,
	setActiveSchema,
	updateSchema,
} from "./academic-years.zod";

export const router = createRouter({
	create: tenantAdminProcedure.input(baseSchema).mutation(({ ctx, input }) =>
		service.createAcademicYear(
			{
				...input,
				startDate: input.startDate.toISOString(),
				endDate: input.endDate.toISOString(),
			},
			ctx.institution.id,
		),
	),
	update: tenantAdminProcedure.input(updateSchema).mutation(({ ctx, input }) =>
		service.updateAcademicYear(input.id, ctx.institution.id, {
			...input,
			startDate: input.startDate?.toISOString(),
			endDate: input.endDate?.toISOString(),
		}),
	),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteAcademicYear(input.id, ctx.institution.id),
		),
	setActive: tenantSuperAdminProcedure
		.input(setActiveSchema)
		.mutation(({ ctx, input }) =>
			service.setActive(input.id, input.isActive, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listAcademicYears(input, ctx.institution.id),
		),
	listPaged: tenantProtectedProcedure
		.input(listPagedSchema)
		.query(({ ctx, input }) =>
			service.listAcademicYearsPaged(input, ctx.institution.id),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getAcademicYearById(input.id, ctx.institution.id),
		),
	activationChecklist: tenantAdminProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.activationChecklist(input.id, ctx.institution.id),
		),
	createNextYear: tenantAdminProcedure
		.input(createNextYearSchema)
		.mutation(({ ctx, input }) =>
			service.createNextYear(input.sourceYearId, ctx.institution.id),
		),
});
