import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	type ExportTemplateType,
	exportTemplateTypes,
} from "../../db/schema/app-schema";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import {
	documentThemeKinds,
	isDocumentThemeKind,
	type ThemeKind,
} from "../exports/themes";
import { getPresetDescriptors } from "../exports/themes/presets-payload";
import * as service from "./export-templates.service";
import * as zod from "./export-templates.zod";

function requireProfileId(ctx: { profile?: { id?: string } | null }): string {
	const userId = ctx.profile?.id;
	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "User profile is required",
		});
	}
	return userId;
}

function requireManageCatalog(ctx: {
	permissions: { canManageCatalog?: boolean };
	action: string;
}): void {
	if (!ctx.permissions.canManageCatalog) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `You do not have permission to ${ctx.action}`,
		});
	}
}

export const exportTemplatesRouter = router({
	list: tenantProtectedProcedure
		.input(zod.listExportTemplatesSchema)
		.query(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "list export templates",
			});
			return await service.listTemplates(ctx.institution.id, input);
		}),

	listPaged: tenantProtectedProcedure
		.input(zod.listExportTemplatesPagedSchema)
		.query(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "list export templates",
			});
			return service.listTemplatesPaged(ctx.institution.id, input);
		}),

	getById: tenantProtectedProcedure
		.input(zod.getExportTemplateSchema)
		.query(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "view export templates",
			});
			return await service.getTemplate(input, ctx.institution.id);
		}),

	getDefault: tenantProtectedProcedure
		.input(
			zod.listExportTemplatesSchema
				.pick({ type: true })
				.required({ type: true }),
		)
		.query(async ({ ctx, input }) => {
			return await service.getDefaultTemplate(ctx.institution.id, input.type);
		}),

	create: tenantAdminProcedure
		.input(zod.createExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "create export templates",
			});
			const userId = requireProfileId(ctx);
			return await service.createTemplate(ctx.institution.id, userId, input);
		}),

	update: tenantAdminProcedure
		.input(zod.updateExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "update export templates",
			});
			const userId = requireProfileId(ctx);
			return await service.updateTemplate(ctx.institution.id, userId, input);
		}),

	delete: tenantAdminProcedure
		.input(zod.deleteExportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "delete export templates",
			});
			await service.deleteTemplate(input, ctx.institution.id);
			return { success: true };
		}),

	setDefault: tenantAdminProcedure
		.input(zod.setDefaultTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "set default export template",
			});
			await service.setDefault(ctx.institution.id, input);
			return { success: true };
		}),

	// ---------- Class assignment ----------
	assignToClass: tenantAdminProcedure
		.input(zod.assignClassTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "assign templates to classes",
			});
			const userId = requireProfileId(ctx);
			return await service.assignClassTemplate(
				ctx.institution.id,
				userId,
				input,
			);
		}),

	updateClassAssignment: tenantAdminProcedure
		.input(zod.updateClassTemplateAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "update class template assignments",
			});
			const userId = requireProfileId(ctx);
			return await service.updateClassTemplateAssignment(
				ctx.institution.id,
				userId,
				input,
			);
		}),

	removeClassAssignment: tenantAdminProcedure
		.input(zod.removeClassTemplateAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "remove class template assignments",
			});
			await service.removeClassTemplateAssignment(input, ctx.institution.id);
			return { success: true };
		}),

	listClassAssignments: tenantProtectedProcedure
		.input(zod.listClassTemplateAssignmentsSchema)
		.query(async ({ ctx, input }) => {
			return await service.listClassAssignments(ctx.institution.id, input);
		}),

	// ---------- Program assignment (with theme overrides) ----------
	assignToProgram: tenantAdminProcedure
		.input(zod.assignProgramTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "assign templates to programs",
			});
			return await service.assignProgramTemplate(ctx.institution.id, input);
		}),

	removeProgramAssignment: tenantAdminProcedure
		.input(zod.removeProgramTemplateAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			requireManageCatalog({
				permissions: ctx.permissions,
				action: "remove program template assignments",
			});
			await service.removeProgramTemplateAssignment(input, ctx.institution.id);
			return { success: true };
		}),

	// ---------- Themes ----------
	getThemePresets: tenantProtectedProcedure
		.input(zod.getThemePresetsSchema)
		.query(({ input }) => {
			return getPresetDescriptors(input.kind);
		}),

	listSupportedKinds: tenantProtectedProcedure.query(() => {
		return {
			allTypes: exportTemplateTypes as readonly ExportTemplateType[],
			documentKinds: documentThemeKinds,
		};
	}),

	getKindMetadata: tenantProtectedProcedure
		.input(z.object({ kind: z.string() }))
		.query(({ input }) => {
			return {
				kind: input.kind,
				supportsThemes: isDocumentThemeKind(input.kind),
				themeKind: isDocumentThemeKind(input.kind)
					? (input.kind as ThemeKind)
					: null,
			};
		}),
});
