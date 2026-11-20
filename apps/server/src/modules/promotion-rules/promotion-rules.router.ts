import { router, tenantAdminProcedure, tenantStaffProcedure } from "@/lib/trpc";
import * as service from "./promotion-rules.service";
import {
	applyPromotionSchema,
	createRuleSchema,
	evaluateClassSchema,
	executionDetailsSchema,
	idSchema,
	listExecutionsSchema,
	listRulesSchema,
	refreshClassSummariesSchema,
	updateRuleSchema,
} from "./promotion-rules.zod";

export const promotionRulesRouter = router({
	// Rule CRUD (admin only)
	create: tenantAdminProcedure
		.input(createRuleSchema)
		.mutation(({ input, ctx }) =>
			service.createRule(input, ctx.institution.id),
		),

	update: tenantAdminProcedure
		.input(updateRuleSchema)
		.mutation(({ input, ctx }) =>
			service.updateRule(input, ctx.institution.id),
		),

	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteRule(input.id, ctx.institution.id),
		),

	getById: tenantStaffProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getRuleById(input.id, ctx.institution.id),
		),

	list: tenantStaffProcedure
		.input(listRulesSchema)
		.query(({ input, ctx }) => service.listRules(input, ctx.institution.id)),

	refreshClassSummaries: tenantAdminProcedure
		.input(refreshClassSummariesSchema)
		.mutation(({ input, ctx }) =>
			service.refreshClassSummaries(input, ctx.institution.id),
		),

	// Evaluation (requires protection, but not necessarily admin)
	evaluateClass: tenantAdminProcedure
		.input(evaluateClassSchema)
		.query(({ input, ctx }) =>
			service.evaluateClassForPromotion(input, ctx.institution.id),
		),

	// Execution (admin only, modifies enrollments)
	applyPromotion: tenantAdminProcedure
		.input(applyPromotionSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.applyPromotion(input, ctx.profile.id, ctx.institution.id);
		}),

	// Execution history
	listExecutions: tenantAdminProcedure
		.input(listExecutionsSchema)
		.query(({ input }) => service.listExecutions(input)),

	getExecutionDetails: tenantAdminProcedure
		.input(executionDetailsSchema)
		.query(({ input }) => service.getExecutionDetails(input.executionId)),
});
