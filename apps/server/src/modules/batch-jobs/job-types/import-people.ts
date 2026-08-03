import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { readImportFile } from "../../data-import/import-file-storage";
import { parsePeople } from "../../data-import/parsers/people.parser";
import type { BatchJobDefinition, PreviewResult } from "../batch-jobs.types";

const paramsSchema = z.object({ fileId: z.string() });
type Params = z.infer<typeof paramsSchema>;

export const importPeopleJob: BatchJobDefinition<Params> = {
	type: "import.people",
	label: "Import People",
	parseParams: (raw) => paramsSchema.parse(raw),

	async preview(params, ctx) {
		const buffer = await readImportFile(params.fileId);
		const parsed = await parsePeople(buffer);
		return {
			steps: [
				{
					name: "Import enseignants (profils sans compte)",
					estimatedItems: parsed.teachers.length,
				},
				{
					name: "Import étudiants",
					estimatedItems: parsed.students.length,
				},
			],
			summary: {
				teacherCount: parsed.teachers.length,
				studentCount: parsed.students.length,
				errors: parsed.errors,
				warnings: parsed.warnings,
			},
			totalItems: parsed.teachers.length + parsed.students.length,
		} satisfies PreviewResult;
	},

	async executeStep(params, step, ctx) {
		const buffer = await readImportFile(params.fileId);
		const parsed = await parsePeople(buffer);

		if (step.stepIndex === 0) {
			// Import teachers as domain-user profiles (no Better-Auth account)
			let created = 0;
			let skipped = 0;
			for (const t of parsed.teachers) {
				const existingProfile = await db.query.domainUsers.findFirst({
					where: and(
						eq(schema.domainUsers.primaryEmail, t.email),
						eq(schema.domainUsers.institutionId, ctx.institutionId),
					),
				});
				if (existingProfile) {
					skipped++;
					continue;
				}
				await db.insert(schema.domainUsers).values({
					institutionId: ctx.institutionId,
					firstName: t.firstName,
					lastName: t.lastName,
					primaryEmail: t.email,
					gender:
						t.gender === "H" || t.gender === "M"
							? "male"
							: t.gender === "F"
								? "female"
								: null,
					phone: t.phone ?? null,
				});
				created++;
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: created,
				itemsSkipped: skipped,
			});
			await ctx.log(
				"info",
				`Enseignants: ${created} profil(s) créé(s), ${skipped} ignoré(s) (email existant)`,
			);
		} else if (step.stepIndex === 1) {
			// Import students: domain user + student record + optional enrollment
			let created = 0;
			let skipped = 0;
			for (const s of parsed.students) {
				const existingProfile = await db.query.domainUsers.findFirst({
					where: and(
						eq(schema.domainUsers.primaryEmail, s.email),
						eq(schema.domainUsers.institutionId, ctx.institutionId),
					),
				});
				if (existingProfile) {
					skipped++;
					continue;
				}
				// Students must have a class (NOT NULL FK in schema)
				if (!s.classCode || !s.academicYearCode) {
					await ctx.log(
						"warn",
						`Étudiant ${s.email}: classCode requis pour créer l'enregistrement étudiant — ligne ignorée`,
					);
					skipped++;
					continue;
				}
				const ay = await db.query.academicYears.findFirst({
					where: and(
						eq(schema.academicYears.name, s.academicYearCode),
						eq(schema.academicYears.institutionId, ctx.institutionId),
					),
				});
				if (!ay) {
					await ctx.log(
						"warn",
						`Étudiant ${s.email}: année "${s.academicYearCode}" introuvable — ignoré`,
					);
					skipped++;
					continue;
				}
				const cls = await db.query.classes.findFirst({
					where: and(
						eq(schema.classes.code, s.classCode),
						eq(schema.classes.academicYear, ay.id),
					),
				});
				if (!cls) {
					await ctx.log(
						"warn",
						`Étudiant ${s.email}: classe "${s.classCode}" introuvable — ignoré`,
					);
					skipped++;
					continue;
				}
				const [newProfile] = await db
					.insert(schema.domainUsers)
					.values({
						institutionId: ctx.institutionId,
						firstName: s.firstName,
						lastName: s.lastName,
						primaryEmail: s.email,
						gender:
							s.gender === "H" || s.gender === "M"
								? "male"
								: s.gender === "F"
									? "female"
									: null,
						phone: s.phone ?? null,
						nationality: s.nationality ?? null,
						dateOfBirth: s.dateOfBirth ?? null,
					})
					.returning({ id: schema.domainUsers.id });
				const registrationNumber =
					s.registrationNumber ??
					`IMP-${randomUUID().slice(0, 8).toUpperCase()}`;
				const [student] = await db
					.insert(schema.students)
					.values({
						institutionId: ctx.institutionId,
						domainUserId: newProfile.id,
						registrationNumber,
						class: cls.id,
					})
					.returning();
				// Create enrollment
				await db.insert(schema.enrollments).values({
					studentId: student.id,
					classId: cls.id,
					academicYearId: ay.id,
					institutionId: ctx.institutionId,
					status: "active",
					admissionType: "normal",
				});
				created++;
			}
			await ctx.reportStepProgress(step.id, {
				itemsProcessed: created,
				itemsSkipped: skipped,
			});
			await ctx.log(
				"info",
				`Étudiants: ${created} créé(s), ${skipped} ignoré(s)`,
			);
		}
	},

	async rollback(_params, ctx) {
		await ctx.log("warn", "Rollback de l'import personnes non supporté");
	},
};
