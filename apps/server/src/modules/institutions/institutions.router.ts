import { z } from "zod";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./institutions.service";
import {
	createInstitutionSchema,
	deleteInstitutionSchema,
	updateInstitutionSchema,
	upsertInstitutionSchema,
} from "./institutions.zod";

/* Every procedure is scoped to the caller's organization (see the service). */
export const institutionsRouter = router({
	get: tenantProtectedProcedure.query(({ ctx }) =>
		service.getInstitution(ctx.institution),
	),
	getById: tenantProtectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(({ ctx, input }) =>
			service.getInstitutionById(input.id, ctx.institution),
		),
	list: tenantProtectedProcedure.query(({ ctx }) =>
		service.listInstitutions(ctx.institution),
	),
	upsert: tenantAdminProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.upsertInstitution(input, ctx.institution),
		),
	create: tenantAdminProcedure
		.input(createInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.createInstitution(input, ctx.institution),
		),
	update: tenantAdminProcedure
		.input(updateInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.updateInstitution(input.id, input.data, ctx.institution),
		),
	delete: tenantAdminProcedure
		.input(deleteInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.deleteInstitution(input.id, ctx.institution),
		),
});
