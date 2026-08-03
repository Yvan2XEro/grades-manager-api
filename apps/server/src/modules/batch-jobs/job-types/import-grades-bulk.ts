import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseGradesBulk } from "../../data-import/parsers/grades-bulk.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importGradesBulkJob: BatchJobDefinition<Params> = {
	type: "import.gradesBulk",
	label: "Import Grades Bulk",
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const buffer = await readImportFile(params.fileId);
		const { rows, errors, warnings } = await parseGradesBulk(buffer);
		return {
			steps: [{ name: "Import notes", estimatedItems: rows.length }],
			summary: { rowCount: rows.length, errors, warnings },
			totalItems: rows.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const buffer = await readImportFile(params.fileId);
		const { rows } = await parseGradesBulk(buffer);
		let created = 0;
		let skipped = 0;

		for (const r of rows) {
			const exam = await db.query.exams.findFirst({
				where: and(
					eq(schema.exams.name, r.examCode),
					eq(schema.exams.institutionId, ctx.institutionId),
				),
			});
			if (!exam) {
				await ctx.log(
					"warn",
					`Examen "${r.examCode}" introuvable — ligne ignorée`,
				);
				skipped++;
				continue;
			}
			if (exam.isLocked) {
				await ctx.log(
					"warn",
					`Examen "${r.examCode}" verrouillé — ligne ignorée`,
				);
				skipped++;
				continue;
			}
			const student = await db.query.students.findFirst({
				where: and(
					eq(schema.students.institutionId, ctx.institutionId),
					eq(schema.students.registrationNumber, r.registrationNumber),
				),
			});
			if (!student) {
				await ctx.log(
					"warn",
					`Matricule "${r.registrationNumber}" introuvable — ligne ignorée`,
				);
				skipped++;
				continue;
			}
			// Upsert grade (unique constraint on student+exam)
			const existing = await db.query.grades.findFirst({
				where: and(
					eq(schema.grades.student, student.id),
					eq(schema.grades.exam, exam.id),
				),
			});
			if (existing) {
				await db
					.update(schema.grades)
					.set({ score: String(r.score) })
					.where(eq(schema.grades.id, existing.id));
			} else {
				await db.insert(schema.grades).values({
					id: randomUUID(),
					student: student.id,
					exam: exam.id,
					score: String(r.score),
				});
			}
			created++;
		}
		await ctx.reportStepProgress(step.id, {
			itemsProcessed: created,
			itemsSkipped: skipped,
		});
		await ctx.log(
			"info",
			`Notes: ${created} importée(s), ${skipped} ignorée(s)`,
		);
	},
};
