import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { ImportJournal, undoImport } from "../../data-import/import-journal";
import { getImportStep } from "../../data-import/steps";
import { readWorkbook } from "../../data-import/steps/workbook";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
	step: z.string(),
	fileId: z.string(),
	/** Academic year of a year step. */
	academicYearId: z.string().optional(),
});
type Params = z.infer<typeof paramsSchema>;

/** Plans a guided-import step from its uploaded workbook. */
async function planStep(params: Params, institutionId: string, jobId: string) {
	const step = getImportStep(params.step);
	const buffer = await readImportFile(params.fileId, institutionId);
	const job = await db.query.batchJobs.findFirst({
		where: eq(schema.batchJobs.id, jobId),
		columns: { createdBy: true },
	});
	const ctx = {
		institutionId,
		academicYearId: params.academicYearId,
		actorId: job?.createdBy ?? undefined,
	};
	const { rows, issues } = step.read
		? await step.read(buffer, ctx)
		: await readWorkbook(step, buffer);
	const plan = await step.plan(rows, ctx);
	return { step, plan: { ...plan, issues: [...issues, ...plan.issues] } };
}

/** One step of the guided import (`/import`): validate, then apply the valid rows. */
export const importStepJob: BatchJobDefinition<Params> = {
	type: "import.step",
	label: "Guided import step",
	supersedePreview: true,
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const { step, plan } = await planStep(params, ctx.institutionId, ctx.jobId);
		const total = plan.sheets.reduce((n, s) => n + s.create + s.update, 0);
		return {
			steps: [{ name: step.label, estimatedItems: total }],
			summary: {
				step: step.key,
				sheets: plan.sheets,
				// Capped: the review shows a sample of very large imports
				changes: (plan.changes ?? []).slice(0, 5000),
				changesTotal: plan.changes?.length ?? 0,
				issues: plan.issues.sort((a, b) =>
					a.level === b.level ? a.row - b.row : a.level === "error" ? -1 : 1,
				),
			},
			totalItems: total,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const { plan } = await planStep(params, ctx.institutionId, ctx.jobId);
		const journal = new ImportJournal(ctx.jobId);
		try {
			await plan.apply((message) => ctx.log("info", message), journal);
		} finally {
			// Even a partial import stays undoable
			await journal.flush();
		}
		const done = plan.sheets.reduce((n, s) => n + s.create + s.update, 0);
		const skipped = plan.sheets.reduce((n, s) => n + s.skipped, 0);
		await ctx.reportStepProgress(step.id, {
			itemsProcessed: done,
			itemsSkipped: skipped,
		});
	},

	/** Undo: deletes what the import created and restores what it changed. */
	async rollback(params, ctx) {
		const job = await db.query.batchJobs.findFirst({
			where: eq(schema.batchJobs.id, ctx.jobId),
			columns: { parentJobId: true },
		});
		if (!job?.parentJobId) throw new Error("Original import job not found");
		const { undone } = await undoImport(job.parentJobId, params.academicYearId);
		await ctx.log("info", `Import undone: ${undone} change(s) reverted.`);
	},
};
