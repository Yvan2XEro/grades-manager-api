import {
	router as createRouter,
	tenantGradingProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./exam-grade-editors.service";
import { assignSchema, listSchema, revokeSchema } from "./exam-grade-editors.zod";

export const examGradeEditorsRouter = createRouter({
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listEditors({
				examId: input.examId,
				institutionId: ctx.institution.id,
			}),
		),
	assign: tenantGradingProcedure
		.input(assignSchema)
		.mutation(({ ctx, input }) =>
			service.assignEditor({
				examId: input.examId,
				editorProfileId: input.editorProfileId,
				institutionId: ctx.institution.id,
				grantedByProfileId: ctx.profile?.id ?? null,
				actor: {
					profileId: ctx.profile?.id ?? null,
					memberRole: ctx.memberRole ?? null,
				},
			}),
		),
	revoke: tenantGradingProcedure
		.input(revokeSchema)
		.mutation(({ ctx, input }) =>
			service.revokeEditor({
				id: input.id,
				examId: input.examId,
				institutionId: ctx.institution.id,
				actor: {
					profileId: ctx.profile?.id ?? null,
					memberRole: ctx.memberRole ?? null,
				},
			}),
		),
});
