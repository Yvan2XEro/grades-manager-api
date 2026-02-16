import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { refreshStudentPromotionSummary } from "@/modules/promotion-rules/student-facts.service";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
	classId: z.string(),
	academicYearId: z.string(),
});

type Params = z.infer<typeof paramsSchema>;

export const studentFactsRefreshJob: BatchJobDefinition<Params> = {
	type: "studentFacts.refreshClass",
	label: "Student Facts Refresh (Class)",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		// Validate class exists and belongs to the academic year
		const klass = await db.query.classes.findFirst({
			where: eq(schema.classes.id, params.classId),
		});
		if (!klass) {
			throw new Error(`Class not found: ${params.classId}`);
		}
		if (klass.academicYear !== params.academicYearId) {
			throw new Error(
				`Class ${params.classId} belongs to year ${klass.academicYear}, not ${params.academicYearId}`,
			);
		}

		const students = await db
			.select({ id: schema.students.id })
			.from(schema.students)
			.where(eq(schema.students.class, params.classId));

		await ctx.log(
			"info",
			`Found ${students.length} students in class ${klass.name}`,
		);

		const steps = [
			{
				name: `Refresh promotion summaries for ${klass.name}`,
				estimatedItems: students.length,
			},
		];

		return {
			steps,
			summary: {
				className: klass.name,
				classId: params.classId,
				academicYearId: params.academicYearId,
				studentCount: students.length,
			},
			totalItems: students.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const students = await db
			.select({ id: schema.students.id })
			.from(schema.students)
			.where(eq(schema.students.class, params.classId));

		let processed = 0;
		let failed = 0;

		for (const student of students) {
			try {
				await refreshStudentPromotionSummary(student.id, params.academicYearId);
				processed++;
			} catch (err) {
				failed++;
				const msg = err instanceof Error ? err.message : String(err);
				await ctx.log("warn", `Failed for student ${student.id}: ${msg}`);
			}

			if ((processed + failed) % 20 === 0) {
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

		if (failed > 0) {
			await ctx.log(
				"warn",
				`Completed with ${failed} failures out of ${processed + failed}`,
			);
		}
	},
};
