import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./deliberations.service";
import {
	computeDeliberationSchema,
	createDeliberationRuleSchema,
	createDeliberationSchema,
	exportDiplomationSchema,
	getLogsSchema,
	idSchema,
	listDeliberationRulesSchema,
	listDeliberationsSchema,
	overrideDecisionSchema,
	promoteAdmittedSchema,
	transitionDeliberationSchema,
	updateDeliberationRuleSchema,
	updateDeliberationSchema,
} from "./deliberations.zod";

const rulesRouter = router({
	create: tenantAdminProcedure
		.input(createDeliberationRuleSchema)
		.mutation(({ input, ctx }) =>
			service.createRule(input, ctx.institution.id),
		),

	update: tenantAdminProcedure
		.input(updateDeliberationRuleSchema)
		.mutation(({ input, ctx }) =>
			service.updateRule(input, ctx.institution.id),
		),

	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) =>
			service.deleteRule(input.id, ctx.institution.id),
		),

	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) =>
			service.getRuleById(input.id, ctx.institution.id),
		),

	list: tenantProtectedProcedure
		.input(listDeliberationRulesSchema)
		.query(({ input, ctx }) => service.listRules(input, ctx.institution.id)),
});

export const deliberationsRouter = router({
	create: tenantAdminProcedure
		.input(createDeliberationSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.create(input, ctx.institution.id, ctx.profile.id);
		}),

	update: tenantAdminProcedure
		.input(updateDeliberationSchema)
		.mutation(({ input, ctx }) => service.update(input, ctx.institution.id)),

	delete: tenantAdminProcedure
		.input(idSchema)
		.mutation(({ input, ctx }) => service.remove(input.id, ctx.institution.id)),

	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ input, ctx }) => service.getById(input.id, ctx.institution.id)),

	list: tenantProtectedProcedure
		.input(listDeliberationsSchema)
		.query(({ input, ctx }) => service.list(input, ctx.institution.id)),

	transition: tenantAdminProcedure
		.input(transitionDeliberationSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.transition(input, ctx.institution.id, ctx.profile.id);
		}),

	compute: tenantAdminProcedure
		.input(computeDeliberationSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.compute(input.id, ctx.institution.id, ctx.profile.id);
		}),

	overrideDecision: tenantAdminProcedure
		.input(overrideDecisionSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.overrideDecision(
				input,
				ctx.institution.id,
				ctx.profile.id,
			);
		}),

	promoteAdmitted: tenantAdminProcedure
		.input(promoteAdmittedSchema)
		.mutation(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.promoteAdmitted(input, ctx.institution.id, ctx.profile.id);
		}),

	exportDiplomation: tenantProtectedProcedure
		.input(exportDiplomationSchema)
		.query(({ input, ctx }) => {
			if (!ctx.profile) {
				throw new Error("Profile required");
			}
			return service.exportDiplomation(
				input,
				ctx.institution.id,
				ctx.profile.id,
			);
		}),

	getLogs: tenantProtectedProcedure
		.input(getLogsSchema)
		.query(({ input }) => service.getLogs(input)),

	rules: rulesRouter,
});
