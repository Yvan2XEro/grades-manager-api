import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./exams.service";
import {
	baseSchema,
	idSchema,
	listSchema,
	lockSchema,
	updateSchema,
} from "./exams.zod";

export const router = createRouter({
	create: adminProcedure.input(baseSchema).mutation(({ input }) =>
		service.createExam({
			name: input.name,
			type: input.type,
			date: input.date,
			percentage: input.percentage.toString(),
			classCourse: input.classCourseId,
		}),
	),
	update: adminProcedure.input(updateSchema).mutation(({ input }) =>
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
