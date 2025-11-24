import z from "zod";
import { businessRoles, domainStatuses } from "@/db/schema/app-schema";
import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./users.service";
import { createUserProfileSchema, updateUserProfileSchema } from "./users.zod";

const listSchema = z.object({
	cursor: z.string().nullish(),
	limit: z.number().min(1).optional(),
	role: z.enum(businessRoles).optional(),
	roles: z.array(z.enum(businessRoles)).optional(),
	status: z.enum(domainStatuses).optional(),
});
const idSchema = z.object({ id: z.string() });

export const usersRouter = router({
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listUsers(input)),
	createProfile: adminProcedure
		.input(createUserProfileSchema)
		.mutation(({ input }) => service.createUserProfile(input)),
	updateProfile: adminProcedure
		.input(updateUserProfileSchema)
		.mutation(({ input }) => {
			const { id, ...payload } = input;
			return service.updateUserProfile(id, payload);
		}),
	deleteProfile: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteUserProfile(input.id)),
});
