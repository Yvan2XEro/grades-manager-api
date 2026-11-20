import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { computeUeCredits } from "@/modules/student-credit-ledger/compute-ue-credits";
import * as repo from "@/modules/student-credit-ledger/student-credit-ledger.repo";
import {
	requireAcademicYearInInstitution,
	requireClassInInstitution,
} from "../../_shared/tenant-ownership";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
	academicYearId: z.string(),
	classId: z.string().optional(),
});

type Params = z.infer<typeof paramsSchema>;

export const creditLedgerRecomputeJob: BatchJobDefinition<Params> = {
	type: "creditLedger.recompute",
	label: "Credit Ledger Recomputation",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		await assertScope(params, ctx.institutionId);
		const students = await getTargetStudents(params, ctx.institutionId);

		await ctx.log("info", `Found ${students.length} students to recompute`, {
			academicYearId: params.academicYearId,
			classId: params.classId ?? null,
		});

		const steps = [
			{
				name: "Reset credit ledgers",
				estimatedItems: students.length,
			},
			{
				name: "Recompute from UE validation (LMD rules)",
				estimatedItems: students.length,
			},
		];

		return {
			steps,
			summary: {
				studentCount: students.length,
				academicYearId: params.academicYearId,
				classId: params.classId ?? null,
			},
			totalItems: students.length * 2,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		// Re-checked at execution: params are stored and replayed later
		await assertScope(params, ctx.institutionId);
		const students = await getTargetStudents(params, ctx.institutionId);

		if (step.stepIndex === 0) {
			// Step 1: Reset ledgers to zero
			let processed = 0;
			for (const student of students) {
				await db
					.update(schema.studentCreditLedgers)
					.set({
						creditsInProgress: 0,
						creditsEarned: 0,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(schema.studentCreditLedgers.studentId, student.id),
							eq(
								schema.studentCreditLedgers.academicYearId,
								params.academicYearId,
							),
						),
					);
				processed++;
				if (processed % 50 === 0) {
					await ctx.reportStepProgress(step.id, {
						itemsProcessed: processed,
					});
				}
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: processed,
			});
		} else if (step.stepIndex === 1) {
			// Step 2: Recompute from UE validation (LMD rules)
			let processed = 0;
			let skipped = 0;
			for (const student of students) {
				const result = await computeUeCredits(
					student.id,
					params.academicYearId,
				);

				if (result.ueResults.length === 0) {
					skipped++;
					processed++;
					continue;
				}

				await repo.setCredits(
					student.id,
					params.academicYearId,
					60, // default required credits
					result.creditsInProgress,
					result.creditsEarned,
				);

				processed++;
				if (processed % 50 === 0) {
					await ctx.reportStepProgress(step.id, {
						itemsProcessed: processed,
						itemsSkipped: skipped,
					});
				}
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: processed,
				itemsSkipped: skipped,
			});
		}
	},
};

/** The year (and class) must be the institution's. */
async function assertScope(params: Params, institutionId: string) {
	await requireAcademicYearInInstitution(params.academicYearId, institutionId);
	if (params.classId)
		await requireClassInInstitution(params.classId, institutionId);
}

async function getTargetStudents(params: Params, institutionId: string) {
	const conditions = [
		eq(schema.enrollments.academicYearId, params.academicYearId),
		eq(schema.enrollments.institutionId, institutionId),
	];
	if (params.classId) {
		conditions.push(eq(schema.enrollments.classId, params.classId));
	}
	return db
		.selectDistinct({ id: schema.enrollments.studentId })
		.from(schema.enrollments)
		.where(and(...conditions));
}
