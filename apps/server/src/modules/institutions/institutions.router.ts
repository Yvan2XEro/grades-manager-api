import { z } from "zod";
import {
	router,
	tenantAdministratorProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import { assertRole, SUPER_ADMIN_ROLES } from "@/modules/authz";
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
	// Institution identity: administrators, not deans.
	upsert: tenantAdministratorProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.upsertInstitution(input, ctx.institution),
		),
	// Administrators manage faculties; a top-level institution (or university)
	// is created or deleted by a super admin only.
	create: tenantAdministratorProcedure
		.input(createInstitutionSchema)
		.mutation(({ ctx, input }) => {
			if (input.type !== "faculty") {
				assertRole(ctx.memberRole, SUPER_ADMIN_ROLES);
			}
			return service.createInstitution(input, ctx.institution);
		}),
	update: tenantAdministratorProcedure
		.input(updateInstitutionSchema)
		.mutation(({ ctx, input }) =>
			service.updateInstitution(input.id, input.data, ctx.institution),
		),
	delete: tenantAdministratorProcedure
		.input(deleteInstitutionSchema)
		.mutation(async ({ ctx, input }) => {
			const target = await service.getInstitutionById(
				input.id,
				ctx.institution,
			);
			if (target && target.type !== "faculty") {
				assertRole(ctx.memberRole, SUPER_ADMIN_ROLES);
			}
			return service.deleteInstitution(input.id, ctx.institution);
		}),
});
