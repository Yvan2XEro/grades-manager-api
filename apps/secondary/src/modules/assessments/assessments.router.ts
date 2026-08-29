import {
	teacherProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./assessments.service";
import {
	batchUpsertSchema,
	classAveragesSchema,
	completionBySubjectSchema,
	completionMatrixSchema,
	listSchema,
	studentResultsSchema,
	upsertSchema,
} from "./assessments.zod";

export const router = trpcRouter({
	listForClass: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listForClass(
				ctx.institution.id,
				input.classId,
				input.subjectId,
				input.termId,
			),
		),

	upsert: teacherProcedure
		.input(upsertSchema)
		.mutation(({ ctx, input }) =>
			service.upsert(
				input,
				ctx.institution.id,
				ctx.session.user.id,
				ctx.callerRole,
			),
		),

	batchUpsert: teacherProcedure
		.input(batchUpsertSchema)
		.mutation(({ ctx, input }) =>
			service.batchUpsert(
				input.items,
				ctx.institution.id,
				ctx.session.user.id,
				ctx.callerRole,
			),
		),

	getStudentResults: tenantProcedure
		.input(studentResultsSchema)
		.query(({ ctx, input }) =>
			service.getStudentResults(
				ctx.institution.id,
				input.studentId,
				input.termId,
			),
		),

	getClassAverages: tenantProcedure
		.input(classAveragesSchema)
		.query(({ ctx, input }) =>
			service.getClassAverages(ctx.institution.id, input.classId, input.termId),
		),

	getCompletionBySubject: tenantProcedure
		.input(completionBySubjectSchema)
		.query(({ ctx, input }) =>
			service.getCompletionBySubject(
				ctx.institution.id,
				input.classId,
				input.termId,
			),
		),

	getCompletionMatrix: tenantProcedure
		.input(completionMatrixSchema)
		.query(({ ctx, input }) =>
			service.getCompletionMatrix(ctx.institution.id, input.classId),
		),
});
