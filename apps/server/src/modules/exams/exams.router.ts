import { TRPCError } from "@trpc/server";
import { isRetakesFeatureEnabled } from "../../config/retakes";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantGradingProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./exams.service";
import {
	baseSchema,
	createRetakeSchema,
	deleteRetakeOverrideSchema,
	idSchema,
	listSchema,
	lockSchema,
	retakeEligibilitySchema,
	retakeOverrideSchema,
	submitSchema,
	updateSchema,
	validateSchema,
} from "./exams.zod";

function ensureRetakesEnabled() {
	if (!isRetakesFeatureEnabled()) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "Retake eligibility feature flag is disabled",
		});
	}
}

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
			{
				profileId: ctx.profile?.id ?? null,
				memberRole: ctx.memberRole ?? null,
			},
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
				{
					profileId: ctx.profile?.id ?? null,
					memberRole: ctx.memberRole ?? null,
				},
			),
		),
	delete: tenantGradingProcedure.input(idSchema).mutation(({ ctx, input }) =>
		service.deleteExam(input.id, ctx.institution.id, {
			profileId: ctx.profile?.id ?? null,
			memberRole: ctx.memberRole ?? null,
		}),
	),
	submit: tenantGradingProcedure
		.input(submitSchema)
		.mutation(({ ctx, input }) =>
			service.submitExam(
				input.examId,
				ctx.profile?.id ?? null,
				ctx.institution.id,
				{
					profileId: ctx.profile?.id ?? null,
					memberRole: ctx.memberRole ?? null,
				},
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
	lock: tenantAdminProcedure.input(lockSchema).mutation(({ ctx, input }) =>
		service.setLock(input.examId, input.lock, ctx.institution.id, {
			profileId: ctx.profile?.id ?? null,
			memberRole: ctx.memberRole ?? null,
		}),
	),
	list: tenantProtectedProcedure.input(listSchema).query(({ ctx, input }) =>
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
	listRetakeEligibility: tenantAdminProcedure
		.input(retakeEligibilitySchema)
		.query(async ({ ctx, input }) => {
			if (!isRetakesFeatureEnabled()) {
				return {
					enabled: false,
					items: [] as service.RetakeEligibilityRow[],
				};
			}
			const items = await service.listRetakeEligibility(
				input.examId,
				ctx.institution.id,
			);
			return { enabled: true, items };
		}),
	upsertRetakeOverride: tenantAdminProcedure
		.input(retakeOverrideSchema)
		.mutation(({ ctx, input }) => {
			ensureRetakesEnabled();
			return service.upsertRetakeOverride(
				input.examId,
				input.studentCourseEnrollmentId,
				{ decision: input.decision, reason: input.reason },
				ctx.institution.id,
				ctx.profile?.id ?? null,
			);
		}),
	deleteRetakeOverride: tenantAdminProcedure
		.input(deleteRetakeOverrideSchema)
		.mutation(({ ctx, input }) => {
			ensureRetakesEnabled();
			return service.deleteRetakeOverride(
				input.examId,
				input.studentCourseEnrollmentId,
				ctx.institution.id,
			);
		}),
	createRetake: tenantAdminProcedure
		.input(createRetakeSchema)
		.mutation(({ ctx, input }) => {
			ensureRetakesEnabled();
			return service.createRetakeExam(
				{
					parentExamId: input.parentExamId,
					name: input.name,
					date: input.date,
					scoringPolicy: input.scoringPolicy,
				},
				ctx.profile?.id ?? null,
				ctx.institution.id,
			);
		}),
});
