import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseEnrollments } from "../../data-import/parsers/enrollments.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importEnrollmentsJob: BatchJobDefinition<Params> = {
	type: "import.enrollments",
	label: "Import Enrollments",
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const buffer = await readImportFile(params.fileId);
		const { rows, errors, warnings } = await parseEnrollments(buffer);
		return {
			steps: [{ name: "Import inscriptions", estimatedItems: rows.length }],
			summary: { rowCount: rows.length, errors, warnings },
			totalItems: rows.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const buffer = await readImportFile(params.fileId);
		const { rows } = await parseEnrollments(buffer);
		let created = 0;
		let skipped = 0;

		for (const r of rows) {
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
			const ay = await db.query.academicYears.findFirst({
				where: and(
					eq(schema.academicYears.name, r.academicYearCode),
					eq(schema.academicYears.institutionId, ctx.institutionId),
				),
			});
			if (!ay) {
				await ctx.log(
					"warn",
					`Année "${r.academicYearCode}" introuvable — ligne ignorée`,
				);
				skipped++;
				continue;
			}
			const cls = await db.query.classes.findFirst({
				where: and(
					eq(schema.classes.code, r.classCode),
					eq(schema.classes.academicYear, ay.id),
				),
			});
			if (!cls) {
				await ctx.log(
					"warn",
					`Classe "${r.classCode}" introuvable — ligne ignorée`,
				);
				skipped++;
				continue;
			}
			const exists = await db.query.enrollments.findFirst({
				where: and(
					eq(schema.enrollments.studentId, student.id),
					eq(schema.enrollments.classId, cls.id),
				),
			});
			if (exists) {
				skipped++;
				continue;
			}
			await db.insert(schema.enrollments).values({
				id: randomUUID(),
				studentId: student.id,
				classId: cls.id,
				academicYearId: ay.id,
				status: "active",
				admissionType:
					(r.admissionType as "normal" | "transfer" | "direct") ?? "normal",
				transferInstitution: r.transferInstitution ?? null,
				transferCredits: r.transferCredits ?? 0,
				institutionId: ctx.institutionId,
			});
			created++;
		}
		await ctx.reportStepProgress(step.id, {
			itemsProcessed: created,
			itemsSkipped: skipped,
		});
		await ctx.log(
			"info",
			`Inscriptions: ${created} créée(s), ${skipped} ignorée(s)`,
		);
	},
};
