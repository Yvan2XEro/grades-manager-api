import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./programs.service";
import {
	baseSchema,
	cloneCurriculumSchema,
	codeSchema,
	duplicateForCyclesSchema,
	idSchema,
	listSchema,
	programIdSchema,
	searchSchema,
	setExportTemplatesSchema,
	updateSchema,
} from "./programs.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createProgram(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateProgram(input.id, ctx.institution.id, input),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteProgram(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listPrograms(input, ctx.institution.id)),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getProgramById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getProgramByCode(input.code, ctx.institution.id),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchPrograms(input, ctx.institution.id),
		),
	cloneCurriculum: tenantAdminProcedure
		.input(cloneCurriculumSchema)
		.mutation(({ ctx, input }) =>
			service.cloneCurriculum(
				input.targetProgramId,
				input.sourceProgramId,
				ctx.institution.id,
			),
		),
	duplicateForCycles: tenantAdminProcedure
		.input(duplicateForCyclesSchema)
		.mutation(({ ctx, input }) =>
			service.duplicateForCycles(
				input.sourceProgramIds,
				input.targetCycleIds,
				ctx.institution.id,
				{ cloneCurriculum: input.cloneCurriculum },
			),
		),
	listExportTemplates: tenantProtectedProcedure
		.input(programIdSchema)
		.query(({ ctx, input }) =>
			service.listProgramExportTemplates(input.programId, ctx.institution.id),
		),
	setExportTemplates: tenantAdminProcedure
		.input(setExportTemplatesSchema)
		.mutation(({ ctx, input }) =>
			service.setProgramExportTemplates(
				input.programId,
				ctx.institution.id,
				input.templates,
			),
		),
});
