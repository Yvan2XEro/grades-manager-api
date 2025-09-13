import {
	adminProcedure,
	router as createRouter,
	superAdminProcedure,
} from "../../lib/trpc";
import * as service from "./profiles.service";
import {
	emailSchema,
	idSchema,
	listSchema,
	updateRoleSchema,
} from "./profiles.zod";

export const router = createRouter({
	getById: adminProcedure
		.input(idSchema)
		.query(({ input }) => service.getProfileById(input.id)),
	getByEmail: adminProcedure
		.input(emailSchema)
		.query(({ input }) => service.getProfileByEmail(input.email)),
	list: adminProcedure
		.input(listSchema)
		.query(({ input }) => service.listProfiles(input)),
	updateRole: superAdminProcedure
		.input(updateRoleSchema)
		.mutation(({ input }) => service.updateRole(input.profileId, input.role)),
});
