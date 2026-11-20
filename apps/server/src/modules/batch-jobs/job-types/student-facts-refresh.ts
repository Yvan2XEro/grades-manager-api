import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { refreshStudentPromotionSummary } from "@/modules/promotion-rules/student-facts.service";
import { requireClassInInstitution } from "../../_shared/tenant-ownership";
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
		const klass = await requireClassInInstitution(
			params.classId,
			ctx.institutionId,
		);
		if (klass.academicYear !== params.academicYearId) {
			throw new Error(
				`Class ${params.classId} belongs to year ${klass.academicYear}, not ${params.academicYearId}`,
			);
		}

		const students = await classStudents(params.classId, ctx.institutionId);

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
		// Re-checked at execution: params are stored and replayed later
		await requireClassInInstitution(params.classId, ctx.institutionId);
		const students = await classStudents(params.classId, ctx.institutionId);

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

function classStudents(classId: string, institutionId: string) {
	return db
		.select({ id: schema.students.id })
		.from(schema.students)
		.where(
			and(
				eq(schema.students.class, classId),
				eq(schema.students.institutionId, institutionId),
			),
		);
}
