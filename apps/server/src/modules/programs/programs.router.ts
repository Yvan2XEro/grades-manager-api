import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./programs.service";
import {
	baseSchema,
	cloneCurriculumSchema,
	codeSchema,
	idSchema,
	listSchema,
	programIdSchema,
	searchSchema,
	setExportTemplatesSchema,
	updateSchema,
} from "./programs.zod";

export const router = createRouter({
	create: adminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createProgram(input, ctx.institution.id),
		),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateProgram(input.id, ctx.institution.id, input),
		),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteProgram(input.id, ctx.institution.id),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listPrograms(input, ctx.institution.id)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getProgramById(input.id, ctx.institution.id),
		),
	getByCode: protectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getProgramByCode(input.code, ctx.institution.id),
		),
	search: protectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchPrograms(input, ctx.institution.id),
		),
	cloneCurriculum: adminProcedure
		.input(cloneCurriculumSchema)
		.mutation(({ ctx, input }) =>
			service.cloneCurriculum(
				input.targetProgramId,
				input.sourceProgramId,
				ctx.institution.id,
			),
		),
	listExportTemplates: protectedProcedure
		.input(programIdSchema)
		.query(({ ctx, input }) =>
			service.listProgramExportTemplates(input.programId, ctx.institution.id),
		),
	setExportTemplates: adminProcedure
		.input(setExportTemplatesSchema)
		.mutation(({ ctx, input }) =>
			service.setProgramExportTemplates(
				input.programId,
				ctx.institution.id,
				input.templates,
			),
		),
});
