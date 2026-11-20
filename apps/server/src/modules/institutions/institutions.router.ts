import { z } from "zod";
import { administratorProcedure, protectedProcedure, router } from "@/lib/trpc";
import { assertRole, SUPER_ADMIN_ROLES } from "@/modules/authz";
import * as repo from "./institutions.repo";
import * as service from "./institutions.service";
import {
	createInstitutionSchema,
	deleteInstitutionSchema,
	updateInstitutionSchema,
	upsertInstitutionSchema,
} from "./institutions.zod";

export const institutionsRouter = router({
	get: protectedProcedure.query(() => service.getInstitution()),
	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(({ input }) => service.getInstitutionById(input.id)),
	list: protectedProcedure.query(() => service.listInstitutions()),
	// Institution identity: administrators, not deans.
	upsert: administratorProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ input }) => service.upsertInstitution(input)),
	// Administrators manage faculties; a top-level institution (or university)
	// is created or deleted by a super admin only.
	create: administratorProcedure
		.input(createInstitutionSchema)
		.mutation(({ ctx, input }) => {
			if (input.type !== "faculty") {
				assertRole(ctx.memberRole, SUPER_ADMIN_ROLES);
			}
			return service.createInstitution(input);
		}),
	update: administratorProcedure
		.input(updateInstitutionSchema)
		.mutation(({ input }) => service.updateInstitution(input.id, input.data)),
	delete: administratorProcedure
		.input(deleteInstitutionSchema)
		.mutation(async ({ ctx, input }) => {
			const target = await repo.getById(input.id);
			if (target && target.type !== "faculty") {
				assertRole(ctx.memberRole, SUPER_ADMIN_ROLES);
			}
			return service.deleteInstitution(input.id);
		}),
});
