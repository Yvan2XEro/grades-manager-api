import { TRPCError } from "@trpc/server";
import z from "zod";
import { businessRoles, domainStatuses } from "@/db/schema/app-schema";
import {
	adminProcedure,
	protectedProcedure,
	router,
	tenantAdminProcedure,
} from "../../lib/trpc";
import * as service from "./users.service";
import {
	createUserProfileSchema,
	createUserWithAuthSchema,
	updateMyProfileSchema,
	updateUserProfileSchema,
} from "./users.zod";

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
	listPaged: tenantAdminProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(25),
				role: z.enum(businessRoles).optional(),
				status: z.enum(domainStatuses).optional(),
				search: z.string().optional(),
				classId: z.string().optional(),
				academicYearId: z.string().optional(),
			}),
		)
		.query(({ input, ctx }) =>
			service.listUsersPaged({
				...input,
				institutionId: ctx.institution.id,
				organizationId: ctx.institution.organizationId!,
			}),
		),
	createProfile: adminProcedure
		.input(createUserProfileSchema)
		.mutation(({ input, ctx }) =>
			service.createUserProfile({
				...input,
				institutionId: ctx.institution?.id,
			}),
		),
	updateProfile: adminProcedure
		.input(updateUserProfileSchema)
		.mutation(({ input }) => {
			const { id, ...payload } = input;
			return service.updateUserProfile(id, payload);
		}),
	deleteProfile: adminProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteUserProfile(input.id)),
	createWithAuth: adminProcedure
		.input(createUserWithAuthSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No active organization context",
				});
			}
			try {
				return await service.createUserWithAuth(input, {
					organizationId: ctx.organizationId,
					institutionId: ctx.institution?.id,
				});
			} catch (err) {
				if (err instanceof service.UserAlreadyExistsError) {
					throw new TRPCError({ code: "CONFLICT", message: err.message });
				}
				throw err;
			}
		}),
	getMyProfile: protectedProcedure.query(({ ctx }) => {
		if (!ctx.profile?.id) {
			return null;
		}
		return service.getMyProfile(ctx.profile.id);
	}),
	updateMyProfile: protectedProcedure
		.input(updateMyProfileSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) {
				throw new Error("No profile found");
			}
			return service.updateMyProfile(ctx.profile.id, input);
		}),
});
