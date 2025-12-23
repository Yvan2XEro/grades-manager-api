import {
	router as createRouter,
	tenantAdminProcedure,
	tenantGradingProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./exams.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	lockSchema,
	submitSchema,
	updateSchema,
	validateSchema,
} from "./exams.zod";

export const router = createRouter({
	create: tenantGradingProcedure.input(baseSchema).mutation(({ ctx, input }) =>
		service.createExam(
			{
				name: input.name,
				type: input.type,
				date: input.date,
				percentage: input.percentage.toString(),
				classCourse: input.classCourseId,
			},
			ctx.profile?.id ?? null,
			ctx.institution.id,
		),
	),
	update: tenantGradingProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateExam(
				input.id,
				{
					...input,
					percentage:
						input.percentage !== undefined
							? input.percentage.toString()
							: undefined,
				},
				ctx.institution.id,
			),
		),
	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteExam(input.id, ctx.institution.id),
		),
	submit: tenantGradingProcedure
		.input(submitSchema)
		.mutation(({ ctx, input }) =>
			service.submitExam(
				input.examId,
				ctx.profile?.id ?? null,
				ctx.institution.id,
			),
		),
	validate: tenantAdminProcedure
		.input(validateSchema)
		.mutation(({ ctx, input }) =>
			service.validateExam(
				input.examId,
				ctx.profile?.id ?? null,
				input.status,
				ctx.institution.id,
			),
		),
	lock: tenantAdminProcedure
		.input(lockSchema)
		.mutation(({ ctx, input }) =>
			service.setLock(input.examId, input.lock, ctx.institution.id),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listExams(input, {
				institutionId: ctx.institution.id,
				profileId: ctx.profile?.id ?? null,
				memberRole: ctx.memberRole ?? null,
			}),
		),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getExamById(input.id, ctx.institution.id),
		),
});
