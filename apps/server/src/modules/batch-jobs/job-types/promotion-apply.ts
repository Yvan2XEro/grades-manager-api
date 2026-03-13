import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as enrollmentsService from "@/modules/enrollments/enrollments.service";
import type { StudentPromotionFacts } from "@/modules/promotion-rules/promotion-rules.types";
import { getStudentPromotionFacts } from "@/modules/promotion-rules/student-facts.service";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
	ruleId: z.string(),
	sourceClassId: z.string(),
	targetClassId: z.string(),
	academicYearId: z.string(),
	studentIds: z.array(z.string()).min(1),
	executedBy: z.string(),
});

type Params = z.infer<typeof paramsSchema>;

export const promotionApplyJob: BatchJobDefinition<Params> = {
	type: "promotion.applyBatch",
	label: "Batch Promotion Apply",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		// Validate rule
		const rule = await db.query.promotionRules.findFirst({
			where: and(
				eq(schema.promotionRules.id, params.ruleId),
				eq(schema.promotionRules.institutionId, ctx.institutionId),
			),
		});
		if (!rule) throw new Error(`Rule not found: ${params.ruleId}`);

		// Validate source class
		const sourceClass = await db.query.classes.findFirst({
			where: eq(schema.classes.id, params.sourceClassId),
		});
		if (!sourceClass)
			throw new Error(`Source class not found: ${params.sourceClassId}`);

		// Validate target class
		const targetClass = await db.query.classes.findFirst({
			where: eq(schema.classes.id, params.targetClassId),
		});
		if (!targetClass)
			throw new Error(`Target class not found: ${params.targetClassId}`);

		// Check for duplicates
		const existingEnrollments = await db
			.select({ studentId: schema.enrollments.studentId })
			.from(schema.enrollments)
			.where(
				and(
					inArray(schema.enrollments.studentId, params.studentIds),
					eq(schema.enrollments.classId, params.targetClassId),
					eq(schema.enrollments.status, "active"),
				),
			);
		if (existingEnrollments.length > 0) {
			throw new Error(
				`${existingEnrollments.length} student(s) already enrolled in target class`,
			);
		}

		await ctx.log("info", `Preview: ${params.studentIds.length} students`, {
			rule: rule.name,
			source: sourceClass.name,
			target: targetClass.name,
		});

		const steps = [
			{
				name: "Evaluate students against rule",
				estimatedItems: params.studentIds.length,
			},
			{
				name: "Apply promotions",
				estimatedItems: params.studentIds.length,
			},
		];

		return {
			steps,
			summary: {
				ruleName: rule.name,
				sourceClassName: sourceClass.name,
				targetClassName: targetClass.name,
				studentCount: params.studentIds.length,
			},
			totalItems: params.studentIds.length * 2,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		if (step.stepIndex === 0) {
			// Step 0: Evaluate students
			let processed = 0;
			let failed = 0;
			for (const studentId of params.studentIds) {
				try {
					await getStudentPromotionFacts(studentId, params.academicYearId, {
						rebuildIfMissing: true,
					});
					processed++;
				} catch (err) {
					failed++;
					const msg = err instanceof Error ? err.message : String(err);
					await ctx.log("warn", `Eval failed for student ${studentId}: ${msg}`);
				}
				if ((processed + failed) % 10 === 0) {
					await ctx.reportStepProgress(step.id, {
						itemsProcessed: processed,
						itemsFailed: failed,
					});
				}
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: processed,
				itemsFailed: failed,
			});
		} else if (step.stepIndex === 1) {
			// Step 1: Apply promotions in a transaction
			const rule = await db.query.promotionRules.findFirst({
				where: eq(schema.promotionRules.id, params.ruleId),
			});
			if (!rule) throw new Error(`Rule not found: ${params.ruleId}`);

			const sourceClass = await db.query.classes.findFirst({
				where: eq(schema.classes.id, params.sourceClassId),
			});
			const targetClass = await db.query.classes.findFirst({
				where: eq(schema.classes.id, params.targetClassId),
			});

			await db.transaction(async (tx) => {
				// Check duplicates inside tx
				const existingEnrollments = await tx
					.select({ studentId: schema.enrollments.studentId })
					.from(schema.enrollments)
					.where(
						and(
							inArray(schema.enrollments.studentId, params.studentIds),
							eq(schema.enrollments.classId, params.targetClassId),
							eq(schema.enrollments.status, "active"),
						),
					);
				if (existingEnrollments.length > 0) {
					throw new Error(
						`${existingEnrollments.length} student(s) already enrolled in target class`,
					);
				}

				// Create execution record
				const execution = await tx
					.insert(schema.promotionExecutions)
					.values({
						ruleId: params.ruleId,
						sourceClassId: params.sourceClassId,
						targetClassId: params.targetClassId,
						academicYearId: params.academicYearId,
						executedBy: params.executedBy,
						studentsEvaluated: params.studentIds.length,
						studentsPromoted: params.studentIds.length,
						metadata: {
							ruleName: rule.name,
							sourceClassName: sourceClass?.name ?? "",
							targetClassName: targetClass?.name ?? "",
							batchJobId: ctx.jobId,
						},
					})
					.returning()
					.then((rows) => rows[0]);

				let processed = 0;
				const executionResults: schema.NewPromotionExecutionResult[] = [];

				for (const studentId of params.studentIds) {
					// Get facts for the result record
					let facts: StudentPromotionFacts | null = null;
					try {
						facts = await getStudentPromotionFacts(
							studentId,
							params.academicYearId,
						);
					} catch {
						// facts may be missing, continue anyway
					}

					// Close current enrollment within tx
					await enrollmentsService.closeActiveEnrollment(
						studentId,
						"completed",
						undefined,
						tx,
					);

					// Create new enrollment in target class
					await tx.insert(schema.enrollments).values({
						studentId,
						classId: params.targetClassId,
						academicYearId: params.academicYearId,
						institutionId: ctx.institutionId,
						status: "active",
					});

					// Update student's class reference
					await tx
						.update(schema.students)
						.set({ class: params.targetClassId })
						.where(eq(schema.students.id, studentId));

					executionResults.push({
						executionId: execution.id,
						studentId,
						wasPromoted: true,
						evaluationData: facts ?? {},
						rulesMatched: [],
					});

					processed++;
					if (processed % 10 === 0) {
						await ctx.reportStepProgress(step.id, {
							itemsProcessed: processed,
						});
					}
				}

				// Bulk insert execution results
				if (executionResults.length > 0) {
					await tx
						.insert(schema.promotionExecutionResults)
						.values(executionResults);
				}
			});

			await ctx.reportStepProgress(step.id, {
				itemsProcessed: params.studentIds.length,
			});
			await ctx.log(
				"info",
				`Successfully promoted ${params.studentIds.length} students`,
			);
		}
	},

	async rollback(params, ctx) {
		await ctx.log("info", "Rolling back batch promotion...");

		await db.transaction(async (tx) => {
			for (const studentId of params.studentIds) {
				// Reopen source enrollment (set back to active)
				const [_sourceEnrollment] = await tx
					.update(schema.enrollments)
					.set({ status: "active", exitedAt: null })
					.where(
						and(
							eq(schema.enrollments.studentId, studentId),
							eq(schema.enrollments.classId, params.sourceClassId),
							eq(schema.enrollments.status, "completed"),
						),
					)
					.returning();

				// Delete target enrollment
				await tx
					.delete(schema.enrollments)
					.where(
						and(
							eq(schema.enrollments.studentId, studentId),
							eq(schema.enrollments.classId, params.targetClassId),
							eq(schema.enrollments.status, "active"),
						),
					);

				// Restore student class to source
				await tx
					.update(schema.students)
					.set({ class: params.sourceClassId })
					.where(eq(schema.students.id, studentId));
			}
		});

		await ctx.log(
			"info",
			`Rolled back ${params.studentIds.length} student promotions`,
		);
	},
};
