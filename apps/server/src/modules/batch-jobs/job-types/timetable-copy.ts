import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({
	sourceAcademicYearId: z.string(),
	targetAcademicYearId: z.string(),
});
type Params = z.infer<typeof paramsSchema>;

export const timetableCopyJob: BatchJobDefinition<Params> = {
	type: "timetable.copyFromYear",
	label: "Copy Timetable from Year",

	parseParams(raw) {
		return paramsSchema.parse(raw);
	},

	async preview(params, ctx) {
		if (params.sourceAcademicYearId === params.targetAcademicYearId) {
			throw new Error("Source and target academic years must be different");
		}

		const sourceYear = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.id, params.sourceAcademicYearId),
				eq(schema.academicYears.institutionId, ctx.institutionId),
			),
		});
		if (!sourceYear) throw new Error("Source academic year not found");

		const targetYear = await db.query.academicYears.findFirst({
			where: and(
				eq(schema.academicYears.id, params.targetAcademicYearId),
				eq(schema.academicYears.institutionId, ctx.institutionId),
			),
		});
		if (!targetYear) throw new Error("Target academic year not found");

		const sessions = await db
			.select({ id: schema.courseSessions.id })
			.from(schema.courseSessions)
			.where(
				and(
					eq(schema.courseSessions.academicYearId, params.sourceAcademicYearId),
					eq(schema.courseSessions.institutionId, ctx.institutionId),
				),
			);

		if (sessions.length === 0) {
			throw new Error(
				`No timetable sessions found in "${sourceYear.name}". Nothing to copy.`,
			);
		}

		await ctx.log(
			"info",
			`Preview: ${sessions.length} sessions from "${sourceYear.name}" → "${targetYear.name}"`,
		);

		return {
			steps: [
				{ name: "Copy timetable sessions", estimatedItems: sessions.length },
			],
			summary: {
				sourceYearName: sourceYear.name,
				targetYearName: targetYear.name,
				sessionCount: sessions.length,
			},
			totalItems: sessions.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const sourceClasses = await db.query.classes.findMany({
			where: and(
				eq(schema.classes.academicYear, params.sourceAcademicYearId),
				eq(schema.classes.institutionId, ctx.institutionId),
			),
		});

		const targetClasses = await db.query.classes.findMany({
			where: and(
				eq(schema.classes.academicYear, params.targetAcademicYearId),
				eq(schema.classes.institutionId, ctx.institutionId),
			),
		});

		const targetByCode = new Map(targetClasses.map((c) => [c.code, c.id]));
		const classMapping: Record<string, string> = {};
		for (const src of sourceClasses) {
			const targetId = targetByCode.get(src.code);
			if (targetId) classMapping[src.id] = targetId;
		}

		const { copySessionsAcrossYears } = await import(
			"../../timetable/timetable.service"
		);
		const result = await copySessionsAcrossYears(
			params.sourceAcademicYearId,
			params.targetAcademicYearId,
			ctx.institutionId,
			classMapping,
		);

		await ctx.reportStepProgress(step.id, {
			itemsProcessed: result.copied + result.skipped,
			itemsSkipped: result.skipped,
		});

		await ctx.log(
			"info",
			`Copied ${result.copied} sessions, skipped ${result.skipped} (already existed), ${result.notMatched} not matched (course missing in target year)`,
		);
	},

	async rollback(params, ctx) {
		await ctx.log("info", "Rolling back timetable copy...");
		await db
			.delete(schema.courseSessions)
			.where(
				and(
					eq(schema.courseSessions.academicYearId, params.targetAcademicYearId),
					eq(schema.courseSessions.institutionId, ctx.institutionId),
				),
			);
		await ctx.log(
			"info",
			"Rolled back: deleted all timetable sessions from target year",
		);
	},
};
