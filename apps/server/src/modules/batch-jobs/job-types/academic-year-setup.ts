import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as repo from "../batch-jobs.repo";
import type {
	BatchJobDefinition,
	JobContext,
	PreviewResult,
} from "../batch-jobs.types";

const paramsSchema = z.object({
	sourceAcademicYearId: z.string(),
	targetAcademicYearId: z.string(),
});

type Params = z.infer<typeof paramsSchema>;

export const academicYearSetupJob: BatchJobDefinition<Params> = {
	type: "academicYear.setup",
	label: "Academic Year Setup",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		const sourceYear = await db.query.academicYears.findFirst({
			where: eq(schema.academicYears.id, params.sourceAcademicYearId),
		});
		if (!sourceYear)
			throw new Error(
				`Source academic year not found: ${params.sourceAcademicYearId}`,
			);

		const targetYear = await db.query.academicYears.findFirst({
			where: eq(schema.academicYears.id, params.targetAcademicYearId),
		});
		if (!targetYear)
			throw new Error(
				`Target academic year not found: ${params.targetAcademicYearId}`,
			);

		if (params.sourceAcademicYearId === params.targetAcademicYearId) {
			throw new Error("Source and target academic years must be different");
		}

		const sourceClasses = await db
			.select({ id: schema.classes.id })
			.from(schema.classes)
			.where(
				and(
					eq(schema.classes.academicYear, params.sourceAcademicYearId),
					eq(schema.classes.institutionId, ctx.institutionId),
				),
			);

		if (sourceClasses.length === 0) {
			throw new Error(`No classes found in source year "${sourceYear.name}"`);
		}

		const sourceClassIds = sourceClasses.map((c) => c.id);
		const classCourses = await db
			.select({ id: schema.classCourses.id })
			.from(schema.classCourses)
			.where(
				and(
					eq(schema.classCourses.institutionId, ctx.institutionId),
					inArray(schema.classCourses.class, sourceClassIds),
				),
			);

		await ctx.log(
			"info",
			`Preview: ${sourceClasses.length} classes, ${classCourses.length} class courses from "${sourceYear.name}" to "${targetYear.name}"`,
		);

		const steps = [
			{
				name: "Copy classes",
				estimatedItems: sourceClasses.length,
			},
			{
				name: "Copy class course assignments",
				estimatedItems: classCourses.length,
			},
		];

		return {
			steps,
			summary: {
				sourceYearName: sourceYear.name,
				targetYearName: targetYear.name,
				classCount: sourceClasses.length,
				classCourseCount: classCourses.length,
			},
			totalItems: sourceClasses.length + classCourses.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		if (step.stepIndex === 0) {
			await executeCopyClasses(params, step, ctx);
		} else if (step.stepIndex === 1) {
			await executeCopyClassCourses(params, step, ctx);
		}
	},

	async rollback(params, ctx) {
		await ctx.log("info", "Rolling back academic year setup...");

		// Find classes created for the target year by this institution
		const targetClasses = await db
			.select({ id: schema.classes.id })
			.from(schema.classes)
			.where(
				and(
					eq(schema.classes.academicYear, params.targetAcademicYearId),
					eq(schema.classes.institutionId, ctx.institutionId),
				),
			);

		// Deleting classes will cascade-delete class courses
		for (const cls of targetClasses) {
			await db.delete(schema.classes).where(eq(schema.classes.id, cls.id));
		}

		await ctx.log(
			"info",
			`Rolled back: deleted ${targetClasses.length} classes (and their course assignments)`,
		);
	},
};

async function executeCopyClasses(
	params: Params,
	step: schema.BatchJobStep,
	ctx: JobContext,
) {
	const sourceClasses = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, params.sourceAcademicYearId),
			eq(schema.classes.institutionId, ctx.institutionId),
		),
	});

	const classMapping: Record<string, string> = {};
	let processed = 0;
	let skipped = 0;

	for (const src of sourceClasses) {
		// Check if class already exists in target year (idempotent)
		const existing = await db.query.classes.findFirst({
			where: and(
				eq(schema.classes.code, src.code),
				eq(schema.classes.academicYear, params.targetAcademicYearId),
			),
		});

		if (existing) {
			classMapping[src.id] = existing.id;
			skipped++;
		} else {
			const [newClass] = await db
				.insert(schema.classes)
				.values({
					code: src.code,
					name: src.name,
					program: src.program,
					academicYear: params.targetAcademicYearId,
					cycleLevelId: src.cycleLevelId,
					programOptionId: src.programOptionId,
					semesterId: src.semesterId,
					totalCredits: src.totalCredits,
					institutionId: src.institutionId,
				})
				.returning();
			classMapping[src.id] = newClass.id;
		}

		processed++;
		if (processed % 10 === 0) {
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

	// Store mapping in step data for step 2
	await repo.updateStep(step.id, {
		data: { classMapping },
	});

	await ctx.log(
		"info",
		`Copied ${processed - skipped} classes, skipped ${skipped} existing`,
	);
}

async function executeCopyClassCourses(
	params: Params,
	step: schema.BatchJobStep,
	ctx: JobContext,
) {
	// Read class mapping from step 0
	const steps = await repo.getStepsForJob(ctx.jobId);
	const step0 = steps.find((s) => s.stepIndex === 0);
	const classMapping = (
		step0?.data as { classMapping?: Record<string, string> }
	)?.classMapping;

	if (!classMapping || Object.keys(classMapping).length === 0) {
		await ctx.log("warn", "No class mapping found from step 1, skipping");
		return;
	}

	let processed = 0;
	let skipped = 0;

	for (const [sourceClassId, targetClassId] of Object.entries(classMapping)) {
		const sourceCourses = await db.query.classCourses.findMany({
			where: and(
				eq(schema.classCourses.class, sourceClassId),
				eq(schema.classCourses.institutionId, ctx.institutionId),
			),
		});

		for (const src of sourceCourses) {
			// Check if already exists (idempotent)
			const existing = await db.query.classCourses.findFirst({
				where: and(
					eq(schema.classCourses.code, src.code),
					eq(schema.classCourses.class, targetClassId),
				),
			});

			if (existing) {
				skipped++;
			} else {
				await db.insert(schema.classCourses).values({
					code: src.code,
					class: targetClassId,
					course: src.course,
					teacher: src.teacher,
					semesterId: src.semesterId,
					coefficient: src.coefficient,
					institutionId: src.institutionId,
				});
			}

			processed++;
			if (processed % 10 === 0) {
				await ctx.reportStepProgress(step.id, {
					itemsProcessed: processed,
					itemsSkipped: skipped,
				});
			}
		}
	}

	await ctx.reportStepProgress(step.id, {
		itemsProcessed: processed,
		itemsSkipped: skipped,
	});

	await ctx.log(
		"info",
		`Copied ${processed - skipped} class courses, skipped ${skipped} existing`,
	);
}
