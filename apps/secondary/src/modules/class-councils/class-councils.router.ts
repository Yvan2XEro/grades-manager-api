import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./class-councils.service";
import {
	addDecisionSchema,
	createSchema,
	idSchema,
	listSchema,
	updateCouncilSchema,
} from "./class-councils.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(
				ctx.institution.id,
				input.classId,
				input.termId,
				input.status,
				{ page: input.page, pageSize: input.pageSize },
			),
		),

	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getCouncil(input.id, ctx.institution.id),
		),

	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) =>
			service.createCouncil(input, ctx.institution.id),
		),

	update: adminProcedure
		.input(updateCouncilSchema)
		.mutation(({ ctx, input }) => {
			const { id, ...fields } = input;
			return service.updateCouncil(id, ctx.institution.id, fields);
		}),

	listDecisions: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.listDecisions(input.id, ctx.institution.id),
		),

	addDecision: adminProcedure
		.input(addDecisionSchema)
		.mutation(({ ctx, input }) =>
			service.addDecision(input, ctx.institution.id),
		),
});
