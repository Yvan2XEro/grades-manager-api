import {
	adminProcedure,
	router as createRouter,
	gradingProcedure,
	protectedProcedure,
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
	create: gradingProcedure.input(baseSchema).mutation(({ ctx, input }) =>
		service.createExam(
			{
				name: input.name,
				type: input.type,
				date: input.date,
				percentage: input.percentage.toString(),
				classCourse: input.classCourseId,
			},
			ctx.profile?.id ?? null,
		),
	),
	update: gradingProcedure.input(updateSchema).mutation(({ input }) =>
		service.updateExam(input.id, {
			...input,
			percentage:
				input.percentage !== undefined
					? input.percentage.toString()
					: undefined,
		}),
	),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteExam(input.id)),
	submit: gradingProcedure
		.input(submitSchema)
		.mutation(({ ctx, input }) =>
			service.submitExam(input.examId, ctx.profile?.id ?? null),
		),
	validate: adminProcedure
		.input(validateSchema)
		.mutation(({ ctx, input }) =>
			service.validateExam(input.examId, ctx.profile?.id ?? null, input.status),
		),
	lock: adminProcedure
		.input(lockSchema)
		.mutation(({ input }) => service.setLock(input.examId, input.lock)),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listExams(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getExamById(input.id)),
});
