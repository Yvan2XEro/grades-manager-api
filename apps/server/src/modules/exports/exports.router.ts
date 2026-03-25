import {
	router,
	tenantAdminProcedure,
	tenantGradingProcedure,
} from "../../lib/trpc";
import * as deliberationsService from "../deliberations/deliberations.service";
import { ExportsService } from "./exports.service";
import {
	generateDeliberationSchema,
	generateEvaluationSchema,
	generatePVSchema,
	generateUESchema,
	previewDeliberationSchema,
	previewEvaluationSchema,
	previewPVSchema,
	previewTemplateSourceSchema,
	previewUESchema,
} from "./exports.zod";

/**
 * Router for grade exports (PV, evaluation, UE)
 */
export const exportsRouter = router({
	/** Generate PV (official minutes) for a class/semester and return PDF or HTML */
	generatePV: tenantGradingProcedure
		.input(generatePVSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generatePV(input);

			return {
				data: result.content,
				filename: `PV_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/** Get structured PV data (JSON) for frontend Excel export */
	getPVData: tenantGradingProcedure
		.input(previewPVSchema)
		.query(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			return service.getPVDataStructured(input);
		}),

	/**
	 * Preview PV in HTML format (no PDF generation)
	 */
	previewPV: tenantGradingProcedure
		.input(previewPVSchema)
		.query(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generatePV({
				...input,
				format: "html",
			});

			return result.content;
		}),

	/**
	 * Generate evaluation publication
	 * Returns PDF or HTML preview
	 */
	generateEvaluation: tenantGradingProcedure
		.input(generateEvaluationSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateEvaluation(input);

			return {
				data: result.content,
				filename: `Evaluation_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/**
	 * Preview evaluation publication in HTML format
	 */
	previewEvaluation: tenantGradingProcedure
		.input(previewEvaluationSchema)
		.query(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateEvaluation({
				...input,
				format: "html",
			});

			return result.content;
		}),

	/**
	 * Generate UE (Teaching Unit) publication
	 * Returns PDF or HTML preview
	 */
	generateUE: tenantGradingProcedure
		.input(generateUESchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateUE(input);

			return {
				data: result.content,
				filename: `UE_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/**
	 * Preview UE publication in HTML format
	 */
	previewUE: tenantGradingProcedure
		.input(previewUESchema)
		.query(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateUE({
				...input,
				format: "html",
			});

			return result.content;
		}),

	/** Generate deliberation export as PDF */
	generateDeliberation: tenantGradingProcedure
		.input(generateDeliberationSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.profile?.id) {
				throw new Error("Profile context is missing");
			}
			const diplomationData = await deliberationsService.exportDiplomation(
				{ id: input.deliberationId },
				ctx.institution.id,
				ctx.profile.id,
			);
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateDeliberation(input, diplomationData);
			return {
				data: result.content,
				filename: `Deliberation_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/** Get structured deliberation data (JSON) for frontend Excel export */
	getDeliberationData: tenantGradingProcedure
		.input(previewDeliberationSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.profile?.id) {
				throw new Error("Profile context is missing");
			}
			const diplomationData = await deliberationsService.exportDiplomation(
				{ id: input.deliberationId },
				ctx.institution.id,
				ctx.profile.id,
			);
			const service = new ExportsService(ctx.institution.id);
			return service.getDeliberationDataStructured(diplomationData);
		}),

	/** Preview deliberation in HTML format */
	previewDeliberation: tenantGradingProcedure
		.input(previewDeliberationSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.profile?.id) {
				throw new Error("Profile context is missing");
			}
			const diplomationData = await deliberationsService.exportDiplomation(
				{ id: input.deliberationId },
				ctx.institution.id,
				ctx.profile.id,
			);
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateDeliberation(
				{ ...input, format: "html" },
				diplomationData,
			);
			return result.content;
		}),

	previewTemplate: tenantAdminProcedure
		.input(previewTemplateSourceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const html = await service.previewTemplate(input);
			return { html };
		}),

	/**
	 * Get export configuration (for UI customization)
	 */
	getConfig: tenantAdminProcedure.query(() => {
		const { loadExportConfig } = require("./template-helper");
		return loadExportConfig();
	}),
});
