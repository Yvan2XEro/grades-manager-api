import { router, tenantAdminProcedure } from "@/lib/trpc";
import * as service from "./academic-year-transitions.service";
import {
	createTransitionSchema,
	listTransitionItemsSchema,
	listTransitionsSchema,
	resolveTransitionItemSchema,
	transitionIdSchema,
} from "./academic-year-transitions.zod";

function actorId(profile: { id: string } | null | undefined) {
	if (!profile) throw new Error("Profile required");
	return profile.id;
}

export const academicYearTransitionsRouter = router({
	readiness: tenantAdminProcedure
		.input(createTransitionSchema)
		.query(({ input, ctx }) => service.readiness(input, ctx.institution.id)),
	createDraft: tenantAdminProcedure
		.input(createTransitionSchema)
		.mutation(({ input, ctx }) =>
			service.createDraft(input, ctx.institution.id, actorId(ctx.profile)),
		),
	list: tenantAdminProcedure
		.input(listTransitionsSchema)
		.query(({ input, ctx }) => service.list(input, ctx.institution.id)),
	getById: tenantAdminProcedure
		.input(transitionIdSchema)
		.query(({ input, ctx }) => service.getById(input.id, ctx.institution.id)),
	getTransitionReadiness: tenantAdminProcedure
		.input(transitionIdSchema)
		.query(({ input, ctx }) =>
			service.getTransitionReadiness(input.id, ctx.institution.id),
		),
	getTransitionAudit: tenantAdminProcedure
		.input(transitionIdSchema)
		.query(({ input, ctx }) =>
			service.getTransitionAudit(input.id, ctx.institution.id),
		),
	listItems: tenantAdminProcedure
		.input(listTransitionItemsSchema)
		.query(({ input, ctx }) => service.listItems(input, ctx.institution.id)),
	resolveItem: tenantAdminProcedure
		.input(resolveTransitionItemSchema)
		.mutation(({ input, ctx }) =>
			service.resolveItem(input, ctx.institution.id, actorId(ctx.profile)),
		),
	submit: tenantAdminProcedure
		.input(transitionIdSchema)
		.mutation(({ input, ctx }) =>
			service.submit(input.id, ctx.institution.id, actorId(ctx.profile)),
		),
	approve: tenantAdminProcedure
		.input(transitionIdSchema)
		.mutation(({ input, ctx }) =>
			service.approve(input.id, ctx.institution.id, actorId(ctx.profile)),
		),
	execute: tenantAdminProcedure
		.input(transitionIdSchema)
		.mutation(({ input, ctx }) =>
			service.execute(input.id, ctx.institution.id, actorId(ctx.profile)),
		),
	cancel: tenantAdminProcedure
		.input(transitionIdSchema)
		.mutation(({ input, ctx }) => service.cancel(input.id, ctx.institution.id)),
});
