import { z } from "zod";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./classes.service";
import {
	baseSchema,
	bulkTransferSchema,
	codeSchema,
	graduatedStudentsSchema,
	idSchema,
	listSchema,
	promoTargetsSchema,
	promotionPreviewSchema,
	searchSchema,
	transferSchema,
	updateSchema,
} from "./classes.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(baseSchema)
		.mutation(({ ctx, input }) =>
			service.createClass(input, ctx.institution.id),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateClass(input.id, input, ctx.institution.id),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteClass(input.id, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listClasses(input, ctx.institution.id)),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getClassById(input.id, ctx.institution.id),
		),
	getByCode: tenantProtectedProcedure
		.input(codeSchema)
		.query(({ ctx, input }) =>
			service.getClassByCode(
				input.code,
				input.academicYearId,
				ctx.institution.id,
			),
		),
	transferStudent: tenantAdminProcedure
		.input(transferSchema)
		.mutation(({ ctx, input }) =>
			service.transferStudent(
				input.studentId,
				input.toClassId,
				ctx.institution.id,
			),
		),
	search: tenantProtectedProcedure
		.input(searchSchema)
		.query(({ ctx, input }) =>
			service.searchClasses(input, ctx.institution.id),
		),
	promoTargets: tenantProtectedProcedure
		.input(promoTargetsSchema)
		.query(({ ctx, input }) =>
			service.getPromoTargets(
				input.sourceClassId,
				ctx.institution.id,
				input.targetAcademicYearId,
			),
		),
	promotionPreview: tenantProtectedProcedure
		.input(promotionPreviewSchema)
		.query(({ ctx, input }) =>
			service.promotionPreview(input.sourceClassId, ctx.institution.id, {
				cursor: input.cursor,
				limit: input.limit,
			}),
		),
	bulkTransfer: tenantAdminProcedure
		.input(bulkTransferSchema)
		.mutation(({ ctx, input }) =>
			service.bulkTransfer(
				input.studentIds,
				input.toClassId,
				ctx.institution.id,
			),
		),
	graduatedStudents: tenantAdminProcedure
		.input(graduatedStudentsSchema)
		.query(({ ctx, input }) =>
			service.listGraduatedStudents(ctx.institution.id, input),
		),
	bulkGenerate: tenantAdminProcedure
		.input(
			z.object({
				academicYearId: z.string(),
				cycleLevelIds: z.array(z.string()).optional(),
				sourceAcademicYearId: z.string().optional(),
			}),
		)
		.mutation(({ ctx, input }) =>
			service.bulkGenerateClasses(
				input.academicYearId,
				ctx.institution.id,
				input.cycleLevelIds,
				input.sourceAcademicYearId,
			),
		),
});
