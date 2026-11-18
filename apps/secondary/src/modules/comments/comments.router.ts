import {
	teacherProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./comments.service";
import {
	batchUpsertCommentsSchema,
	listCommentsSchema,
	upsertCommentSchema,
} from "./comments.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listCommentsSchema)
		.query(({ ctx, input }) =>
			service.listByClassSubjectTerm(
				ctx.institution.id,
				input.classId,
				input.subjectId,
				input.termId,
			),
		),

	upsert: teacherProcedure
		.input(upsertCommentSchema)
		.mutation(({ ctx, input }) =>
			service.upsertComment({
				institutionId: ctx.institution.id,
				studentId: input.studentId,
				subjectId: input.subjectId,
				termId: input.termId,
				classId: input.classId,
				comment: input.comment,
			}),
		),

	batchUpsert: teacherProcedure
		.input(batchUpsertCommentsSchema)
		.mutation(({ ctx, input }) =>
			service.batchUpsertComments(ctx.institution.id, input.items),
		),
});
