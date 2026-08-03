import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { slugify } from "@/lib/strings";
import { readImportFile } from "../../data-import/import-file-storage";
import { parseAcademicStructure } from "../../data-import/parsers/academic-structure.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importAcademicStructureJob: BatchJobDefinition<Params> = {
	type: "import.academicStructure",
	label: "Import Academic Structure",
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const buffer = await readImportFile(params.fileId);
		const parsed = await parseAcademicStructure(buffer);
		await ctx.log(
			"info",
			`Preview: ${parsed.programmes.length} programmes, ${parsed.cours.length} cours, ${parsed.classes.length} classes — ${parsed.errors.length} erreur(s)`,
		);
		return {
			steps: [
				{ name: "Import programmes", estimatedItems: parsed.programmes.length },
				{ name: "Import cours", estimatedItems: parsed.cours.length },
				{ name: "Import classes", estimatedItems: parsed.classes.length },
			],
			summary: {
				programmeCount: parsed.programmes.length,
				coursCount: parsed.cours.length,
				classeCount: parsed.classes.length,
				errors: parsed.errors,
				warnings: parsed.warnings,
			},
			totalItems:
				parsed.programmes.length + parsed.cours.length + parsed.classes.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const buffer = await readImportFile(params.fileId);
		const parsed = await parseAcademicStructure(buffer);

		if (step.stepIndex === 0) {
			let created = 0;
			let skipped = 0;
			for (const p of parsed.programmes) {
				const exists = await db.query.programs.findFirst({
					where: and(
						eq(schema.programs.code, p.code),
						eq(schema.programs.institutionId, ctx.institutionId),
					),
				});
				if (exists) {
					skipped++;
					continue;
				}
				// Resolve studyCycle by code
				let cycleId: string | null = null;
				if (p.studyCycleCode) {
					const cycle = await db.query.studyCycles.findFirst({
						where: and(
							eq(schema.studyCycles.code, p.studyCycleCode),
							eq(schema.studyCycles.institutionId, ctx.institutionId),
						),
					});
					if (cycle) {
						cycleId = cycle.id;
					} else {
						await ctx.log(
							"warn",
							`Programme ${p.code}: cycle "${p.studyCycleCode}" introuvable — cycleId laissé vide`,
						);
					}
				}
				await db.insert(schema.programs).values({
					institutionId: ctx.institutionId,
					code: p.code,
					name: p.nameFr,
					nameEn: p.nameEn ?? null,
					slug: slugify(p.nameFr),
					cycleId,
				});
				created++;
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: created,
				itemsSkipped: skipped,
			});
			await ctx.log(
				"info",
				`Programmes: ${created} créé(s), ${skipped} ignoré(s)`,
			);
		} else if (step.stepIndex === 1) {
			let created = 0;
			let skipped = 0;
			for (const c of parsed.cours) {
				// Resolve program by teachingUnit code prefix or by looking up TU directly
				const tu = await db.query.teachingUnits.findFirst({
					where: eq(schema.teachingUnits.code, c.teachingUnitCode),
				});
				if (!tu) {
					await ctx.log(
						"warn",
						`Cours ${c.code}: UE "${c.teachingUnitCode}" introuvable — ligne ignorée`,
					);
					skipped++;
					continue;
				}
				const exists = await db.query.courses.findFirst({
					where: and(
						eq(schema.courses.code, c.code),
						eq(schema.courses.program, tu.programId),
					),
				});
				if (exists) {
					skipped++;
					continue;
				}
				await db.insert(schema.courses).values({
					code: c.code,
					name: c.name,
					program: tu.programId,
					teachingUnitId: tu.id,
					hours: 1,
					defaultCoefficient: String(c.coefficient ?? 1),
				});
				created++;
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: created,
				itemsSkipped: skipped,
			});
			await ctx.log("info", `Cours: ${created} créé(s), ${skipped} ignoré(s)`);
		} else if (step.stepIndex === 2) {
			let created = 0;
			let skipped = 0;
			for (const cl of parsed.classes) {
				// Resolve all required FKs
				const ay = await db.query.academicYears.findFirst({
					where: and(
						eq(schema.academicYears.name, cl.academicYearCode),
						eq(schema.academicYears.institutionId, ctx.institutionId),
					),
				});
				if (!ay) {
					await ctx.log(
						"warn",
						`Classe ${cl.code}: année "${cl.academicYearCode}" introuvable — ignorée`,
					);
					skipped++;
					continue;
				}
				const program = await db.query.programs.findFirst({
					where: and(
						eq(schema.programs.code, cl.programCode),
						eq(schema.programs.institutionId, ctx.institutionId),
					),
				});
				if (!program) {
					await ctx.log(
						"warn",
						`Classe ${cl.code}: programme "${cl.programCode}" introuvable — ignorée`,
					);
					skipped++;
					continue;
				}
				// Resolve cycleLevel by code
				const cycleLevel = cl.cycleLevelCode
					? await db.query.cycleLevels.findFirst({
							where: eq(schema.cycleLevels.code, cl.cycleLevelCode),
						})
					: null;
				if (!cycleLevel) {
					await ctx.log(
						"warn",
						`Classe ${cl.code}: niveau "${cl.cycleLevelCode}" introuvable — ignorée`,
					);
					skipped++;
					continue;
				}
				// Resolve programOption by code within program
				const programOption = cl.programOptionCode
					? await db.query.programOptions.findFirst({
							where: and(
								eq(schema.programOptions.code, cl.programOptionCode),
								eq(schema.programOptions.programId, program.id),
							),
						})
					: null;
				if (!programOption) {
					await ctx.log(
						"warn",
						`Classe ${cl.code}: option "${cl.programOptionCode}" introuvable — ignorée`,
					);
					skipped++;
					continue;
				}
				const exists = await db.query.classes.findFirst({
					where: and(
						eq(schema.classes.code, cl.code),
						eq(schema.classes.academicYear, ay.id),
					),
				});
				if (exists) {
					skipped++;
					continue;
				}
				await db.insert(schema.classes).values({
					institutionId: ctx.institutionId,
					code: cl.code,
					name: cl.name,
					program: program.id,
					academicYear: ay.id,
					cycleLevelId: cycleLevel.id,
					programOptionId: programOption.id,
				});
				created++;
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: created,
				itemsSkipped: skipped,
			});
			await ctx.log(
				"info",
				`Classes: ${created} créée(s), ${skipped} ignorée(s)`,
			);
		}
	},

	async rollback(_params, ctx) {
		await ctx.log(
			"warn",
			"Rollback de l'import structure non supporté (risque de suppression de données partagées)",
		);
	},
};
