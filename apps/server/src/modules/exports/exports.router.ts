import { TRPCError } from "@trpc/server";
import {
	router,
	tenantAdminProcedure,
	tenantGradingProcedure,
} from "../../lib/trpc";
import * as deliberationsService from "../deliberations/deliberations.service";
import * as eligibility from "../export-eligibility/export-eligibility.service";
import { ExportsService } from "./exports.service";
import {
	bulkExportFiltersSchema,
	generateCourseCatalogSchema,
	generateDeliberationSchema,
	generateEcSchema,
	generateEvaluationSchema,
	generatePVSchema,
	generateUESchema,
	previewDeliberationSchema,
	previewEcSchema,
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
			const pv = await eligibility.checkPvEligibility({
				classId: input.classId,
				semesterId: input.semesterId,
				institutionId: ctx.institution.id,
			});
			eligibility.assertPvEligible(pv);
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generatePV(input);

			return {
				data: result.content,
				// Service computes a meaningful filename from the class metadata;
				// fall back to a generic stamp only if it didn't.
				filename:
					result.filename ??
					`PV_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
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
			// Per-évaluation export is intentionally NOT gated on the EC reaching
			// 100%. Publishing a single CC / TP / Examen result is valid even if
			// the EC isn't fully evaluated yet — the 100% rule only applies to EC,
			// UE and PV exports which aggregate multiple evaluations.
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateEvaluation(input);

			return {
				data: result.content,
				filename:
					result.filename ??
					`Evaluation_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
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
	 * Generate EC (Élément Constitutif / class_course) publication.
	 * Aggregates ALL normal-session evaluations (CC + TP + Examen ...) of one
	 * EC into a single PDF — one row per student with their final EC average.
	 * Eligibility (sum of percentages = 100%) is enforced HERE: this is the
	 * level at which an "EC final result" only makes sense if the EC is fully
	 * evaluated. The per-évaluation export is unconstrained.
	 */
	generateEc: tenantGradingProcedure
		.input(generateEcSchema)
		.mutation(async ({ ctx, input }) => {
			const ec = await eligibility.checkEcEligibility(
				input.classCourseId,
				ctx.institution.id,
			);
			eligibility.assertEcEligible(ec);
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateEc(input);

			return {
				data: result.content,
				filename:
					result.filename ??
					`EC_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/** Preview EC publication in HTML format */
	previewEc: tenantGradingProcedure
		.input(previewEcSchema)
		.query(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateEc({
				...input,
				format: "html",
			});
			return result.content;
		}),

	/**
	 * Bulk-export every evaluation matching the scope filters into a ZIP.
	 * Folders are organized as `Evaluations/<programCode>/<classCode>/`.
	 * No eligibility check — single évaluations publish unconstrained.
	 */
	bulkExportEvaluations: tenantGradingProcedure
		.input(bulkExportFiltersSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.bulkExportEvaluations(input);
			return {
				data: result.content,
				filename: result.filename,
				mimeType: result.mimeType,
				total: result.total,
				succeeded: result.succeeded,
				skipped: result.skipped,
			};
		}),

	/**
	 * Bulk-export every EC matching the filters. Skips ECs whose exam
	 * percentages don't sum to 100% by default (`skipIneligible: true`),
	 * surfacing them in `skipped` so the caller can show a summary.
	 * Folders: `ECs/<programCode>/<classCode>/`.
	 */
	bulkExportEcs: tenantGradingProcedure
		.input(bulkExportFiltersSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.bulkExportEcs(input);
			return {
				data: result.content,
				filename: result.filename,
				mimeType: result.mimeType,
				total: result.total,
				succeeded: result.succeeded,
				skipped: result.skipped,
			};
		}),

	/**
	 * Bulk-export every UE (per UE × class × semester). Skips UEs where
	 * any of the constituent ECs fails eligibility. Folders:
	 * `UEs/<programCode>/<classCode>/`.
	 */
	bulkExportUes: tenantGradingProcedure
		.input(bulkExportFiltersSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const result = await service.bulkExportUes(input);
			return {
				data: result.content,
				filename: result.filename,
				mimeType: result.mimeType,
				total: result.total,
				succeeded: result.succeeded,
				skipped: result.skipped,
			};
		}),

	/**
	 * Generate UE (Teaching Unit) publication
	 * Returns PDF or HTML preview
	 */
	generateUE: tenantGradingProcedure
		.input(generateUESchema)
		.mutation(async ({ ctx, input }) => {
			const ue = await eligibility.checkUeEligibility({
				teachingUnitId: input.teachingUnitId,
				classId: input.classId,
				semesterId: input.semesterId,
				institutionId: ctx.institution.id,
			});
			eligibility.assertUeEligible(ue);
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateUE(input);

			return {
				data: result.content,
				filename:
					result.filename ??
					`UE_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
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
			return service.getDeliberationDataStructured(
				diplomationData,
				input.deliberationId,
			);
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

	/** Generate a PDF catalogue of UEs and ECs for given classes */
	generateCourseCatalog: tenantAdminProcedure
		.input(generateCourseCatalogSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.classIds.length === 0 && !input.academicYearId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Provide classIds or academicYearId",
				});
			}
			const service = new ExportsService(ctx.institution.id);
			const result = await service.generateCourseCatalog(input);
			return {
				data: result.content,
				filename: `Catalogue_UE_${new Date().toISOString().slice(0, 10)}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	previewTemplate: tenantAdminProcedure
		.input(previewTemplateSourceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new ExportsService(ctx.institution.id);
			const html = await service.previewTemplate(input);
			return { html };
		}),

	/**
	 * Render a sample PDF for every bundled template (8 kinds × 2 variants = 16
	 * files), bundle them into a single ZIP, return as base64. Uses the active
	 * tenant's REAL institution + center metadata and a fictitious student.
	 * Useful for design review and QA without leaving the admin UI.
	 */
	exportAllSampleTemplates: tenantAdminProcedure.mutation(async ({ ctx }) => {
		const service = new ExportsService(ctx.institution.id);
		return await service.exportAllSampleTemplates();
	}),

	/**
	 * Get export configuration (for UI customization)
	 */
	getConfig: tenantAdminProcedure.query(() => {
		const { loadExportConfig } = require("./template-helper");
		return loadExportConfig();
	}),
});
