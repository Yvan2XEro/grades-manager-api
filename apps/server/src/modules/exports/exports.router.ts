import { z } from "zod";
import { adminProcedure, gradingProcedure, router } from "../../lib/trpc";
import { ExportsService } from "./exports.service";
import {
	generateEvaluationSchema,
	generatePVSchema,
	generateUESchema,
	previewEvaluationSchema,
	previewPVSchema,
	previewUESchema,
} from "./exports.zod";

/**
 * Router for grade exports (PV, evaluation, UE)
 */
export const exportsRouter = router({
	/**
	 * Generate PV (Procès-Verbal) for a class/semester
	 * Returns PDF or HTML preview
	 */
	generatePV: gradingProcedure
		.input(generatePVSchema)
		.mutation(async ({ input }) => {
			const service = new ExportsService();
			const result = await service.generatePV(input);

			return {
				data: result.content,
				filename: `PV_${new Date().toISOString().split("T")[0]}.${input.format === "html" ? "html" : "pdf"}`,
				mimeType: result.mimeType,
			};
		}),

	/**
	 * Preview PV in HTML format (no PDF generation)
	 */
	previewPV: gradingProcedure
		.input(previewPVSchema)
		.query(async ({ input }) => {
			const service = new ExportsService();
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
	generateEvaluation: gradingProcedure
		.input(generateEvaluationSchema)
		.mutation(async ({ input }) => {
			const service = new ExportsService();
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
	previewEvaluation: gradingProcedure
		.input(previewEvaluationSchema)
		.query(async ({ input }) => {
			const service = new ExportsService();
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
	generateUE: gradingProcedure
		.input(generateUESchema)
		.mutation(async ({ input }) => {
			const service = new ExportsService();
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
	previewUE: gradingProcedure
		.input(previewUESchema)
		.query(async ({ input }) => {
			const service = new ExportsService();
			const result = await service.generateUE({
				...input,
				format: "html",
			});

			return result.content;
		}),

	/**
	 * Get export configuration (for UI customization)
	 */
	getConfig: adminProcedure.query(() => {
		const { loadExportConfig } = require("./template-helper");
		return loadExportConfig();
	}),
});
