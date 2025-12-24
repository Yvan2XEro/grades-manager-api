import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./export-templates.service";
import * as zod from "./export-templates.zod";

export const exportTemplatesRouter = router({
	list: protectedProcedure
		.input(zod.listExportTemplatesSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to list export templates",
				});
			}

			return await service.listTemplates(ctx.institution.id, input);
		}),

	getById: protectedProcedure
		.input(zod.getExportTemplateSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view export templates",
				});
			}

			return await service.getTemplate(input);
		}),

	getDefault: protectedProcedure
		.input(
			zod.listExportTemplatesSchema.pick({ type: true }).required({ type: true }),
		)
		.query(async ({ ctx, input }) => {
			return await service.getDefaultTemplate(
				ctx.institution.id,
				input.type,
			);
		}),

	create: adminProcedure
		.input(zod.createExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create export templates",
				});
			}

			const userId = ctx.profile?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User ID is required",
				});
			}

			return await service.createTemplate(ctx.institution.id, userId, input);
		}),

	update: adminProcedure
		.input(zod.updateExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update export templates",
				});
			}

			const userId = ctx.profile?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User ID is required",
				});
			}

			return await service.updateTemplate(userId, input);
		}),

	delete: adminProcedure
		.input(zod.deleteExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to delete export templates",
				});
			}

			await service.deleteTemplate(input);
			return { success: true };
		}),

	setDefault: adminProcedure
		.input(zod.setDefaultTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to set default export templates",
				});
			}

			await service.setDefault(ctx.institution.id, input);
			return { success: true };
		}),
});
