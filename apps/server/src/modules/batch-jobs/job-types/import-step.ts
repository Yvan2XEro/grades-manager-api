import { z } from "zod";
import { readImportFile } from "../../data-import/import-file-storage";
import { getImportStep } from "../../data-import/steps";
import { readWorkbook } from "../../data-import/steps/workbook";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ step: z.string(), fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

/** Plans a guided-import step from its uploaded workbook. */
async function planStep(params: Params, institutionId: string) {
	const step = getImportStep(params.step);
	const buffer = await readImportFile(params.fileId);
	const { rows, issues } = await readWorkbook(step, buffer);
	const plan = await step.plan(rows, { institutionId });
	return { step, plan: { ...plan, issues: [...issues, ...plan.issues] } };
}

/** One step of the guided import (`/import`): validate, then apply the valid rows. */
export const importStepJob: BatchJobDefinition<Params> = {
	type: "import.step",
	label: "Guided import step",
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const { step, plan } = await planStep(params, ctx.institutionId);
		const total = plan.sheets.reduce((n, s) => n + s.create + s.update, 0);
		return {
			steps: [{ name: step.label, estimatedItems: total }],
			summary: {
				step: step.key,
				sheets: plan.sheets,
				issues: plan.issues.sort((a, b) =>
					a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1,
				),
			},
			totalItems: total,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const { plan } = await planStep(params, ctx.institutionId);
		await plan.apply((message) => ctx.log("info", message));
		const done = plan.sheets.reduce((n, s) => n + s.create + s.update, 0);
		const skipped = plan.sheets.reduce((n, s) => n + s.skipped, 0);
		await ctx.reportStepProgress(step.id, {
			itemsProcessed: done,
			itemsSkipped: skipped,
		});
	},
};
