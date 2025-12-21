import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./promotion-rules.service";
import {
	applyPromotionSchema,
	createRuleSchema,
	evaluateClassSchema,
	executionDetailsSchema,
	idSchema,
	listExecutionsSchema,
	listRulesSchema,
	updateRuleSchema,
} from "./promotion-rules.zod";

export const promotionRulesRouter = router({
	// Rule CRUD (admin only)
	create: adminProcedure
		.input(createRuleSchema)
		.mutation(({ input, ctx }) =>
			service.createRule(input, ctx.institution.id),
		),

	update: adminProcedure
		.input(updateRuleSchema)
		.mutation(({ input, ctx }) =>
			service.updateRule(input, ctx.institution.id),
		),

	delete: adminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteRule(input.id, ctx.institution.id),
		),

	getById: protectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getRuleById(input.id, ctx.institution.id),
		),

	list: protectedProcedure
		.input(listRulesSchema)
		.query(({ input, ctx }) => service.listRules(input, ctx.institution.id)),

	// Evaluation (requires protection, but not necessarily admin)
	evaluateClass: protectedProcedure
		.input(evaluateClassSchema)
		.query(({ input, ctx }) =>
			service.evaluateClassForPromotion(input, ctx.institution.id),
		),

	// Execution (admin only, modifies enrollments)
	applyPromotion: adminProcedure
		.input(applyPromotionSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.applyPromotion(input, ctx.profile.id, ctx.institution.id);
		}),

	// Execution history
	listExecutions: protectedProcedure
		.input(listExecutionsSchema)
		.query(({ input }) => service.listExecutions(input)),

	getExecutionDetails: protectedProcedure
		.input(executionDetailsSchema)
		.query(({ input }) => service.getExecutionDetails(input.executionId)),
});
