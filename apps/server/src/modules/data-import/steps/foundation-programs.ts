import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode, slugify } from "@/lib/strings";
import { createProgram } from "@/modules/programs/programs.service";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";

const PROGRAMS = "Programmes";
const OPTIONS = "Options";

const programFields = (
	values: Record<string, string>,
	cycleId: string | null,
) => ({
	name: values.name,
	nameEn: values.nameEn || null,
	abbreviation: values.abbreviation || null,
	cycleId,
	domainFr: values.domain || null,
	specialiteFr: values.speciality || null,
	diplomaTitleFr: values.diplomaTitle || null,
});

/** Programmes (filières) and their options (parcours / spécialités). */
export const programsStep: ImportStepDef = {
	key: "foundation.programs",
	label: "Programmes & options",
	sheets: [
		{
			name: PROGRAMS,
			description: "Un programme (filière) par ligne.",
			columns: [
				{
					key: "code",
					header: "Code",
					required: true,
					hint: "Ex. INF, GL, SIN",
				},
				{ key: "name", header: "Nom", required: true, width: 32 },
				{ key: "nameEn", header: "Nom (anglais)", width: 28 },
				{ key: "abbreviation", header: "Abréviation" },
				{
					key: "cycleCode",
					header: "Code cycle",
					listFrom: "cycles",
					hint: "Cycle importé à l'étape « Cycles & niveaux »",
				},
				{ key: "domain", header: "Domaine", width: 24 },
				{ key: "speciality", header: "Spécialité", width: 24 },
				{ key: "diplomaTitle", header: "Intitulé du diplôme", width: 32 },
			],
		},
		{
			name: OPTIONS,
			description:
				"Les options (parcours) de chaque programme. Chaque programme reçoit automatiquement une option « default » si vous n'en déclarez aucune.",
			columns: [
				{
					key: "programCode",
					header: "Code programme",
					required: true,
					listFrom: "programs",
				},
				{
					key: "code",
					header: "Code option",
					required: true,
					hint: "Ex. GEN, RES, IA",
				},
				{ key: "name", header: "Nom", required: true, width: 28 },
				{ key: "description", header: "Description", width: 32 },
			],
		},
	],

	async existingRows({ institutionId }) {
		const [programs, cycles, options] = await Promise.all([
			db.query.programs.findMany({
				where: eq(schema.programs.institutionId, institutionId),
				orderBy: schema.programs.code,
			}),
			db.query.studyCycles.findMany({
				where: eq(schema.studyCycles.institutionId, institutionId),
			}),
			db.query.programOptions.findMany({
				where: eq(schema.programOptions.institutionId, institutionId),
			}),
		]);
		const cycleCode = new Map(cycles.map((c) => [c.id, c.code]));
		const programCode = new Map(programs.map((p) => [p.id, p.code]));
		return {
			[PROGRAMS]: programs.map((p) => [
				p.code,
				p.name,
				p.nameEn ?? "",
				p.abbreviation ?? "",
				p.cycleId ? (cycleCode.get(p.cycleId) ?? "") : "",
				p.domainFr ?? "",
				p.specialiteFr ?? "",
				p.diplomaTitleFr ?? "",
			]),
			[OPTIONS]: options
				.filter((o) => programCode.has(o.programId))
				.sort((a, b) =>
					(programCode.get(a.programId) ?? "").localeCompare(
						programCode.get(b.programId) ?? "",
					),
				)
				.map((o) => [
					programCode.get(o.programId) ?? "",
					o.code,
					o.name,
					o.description ?? "",
				]),
		};
	},

	async lists({ institutionId }) {
		const [cycles, programs] = await Promise.all([
			db.query.studyCycles.findMany({
				where: eq(schema.studyCycles.institutionId, institutionId),
			}),
			db.query.programs.findMany({
				where: eq(schema.programs.institutionId, institutionId),
			}),
		]);
		return {
			cycles: cycles.map((c) => c.code).sort(),
			programs: programs.map((p) => p.code).sort(),
		};
	},

	async plan(rows, { institutionId }) {
		const issues: ImportIssue[] = [
			...findDuplicates(PROGRAMS, rows[PROGRAMS], (r) => r.values.code, "Code"),
			...findDuplicates(PROGRAMS, rows[PROGRAMS], (r) => r.values.name, "Nom"),
			...findDuplicates(
				OPTIONS,
				rows[OPTIONS],
				(r) => `${r.values.programCode}|${r.values.code}`,
				"Code option",
			),
		];
		const [programs, cycles, options] = await Promise.all([
			db.query.programs.findMany({
				where: eq(schema.programs.institutionId, institutionId),
			}),
			db.query.studyCycles.findMany({
				where: eq(schema.studyCycles.institutionId, institutionId),
			}),
			db.query.programOptions.findMany({
				where: eq(schema.programOptions.institutionId, institutionId),
			}),
		]);
		const programByCode = new Map(programs.map((p) => [p.code, p]));
		const cycleByCode = new Map(cycles.map((c) => [c.code, c]));

		for (const r of rows[PROGRAMS]) {
			const code = normalizeCode(r.values.code);
			if (
				r.values.cycleCode &&
				!cycleByCode.has(normalizeCode(r.values.cycleCode))
			)
				issues.push({
					sheet: PROGRAMS,
					row: r.row,
					column: "Code cycle",
					level: "error",
					message: `Cycle « ${r.values.cycleCode} » inconnu : importez-le d'abord à l'étape « Cycles & niveaux ».`,
				});
			const sameName = programs.find(
				(p) =>
					normalize(p.name) === normalize(r.values.name) && p.code !== code,
			);
			if (sameName)
				issues.push({
					sheet: PROGRAMS,
					row: r.row,
					column: "Nom",
					level: "error",
					message: `Ce nom est déjà utilisé par le programme « ${sameName.code} ».`,
				});
			if (!r.values.cycleCode)
				issues.push({
					sheet: PROGRAMS,
					row: r.row,
					column: "Code cycle",
					level: "warning",
					message:
						"Sans cycle, les niveaux du programme ne seront pas proposés pour ses classes.",
				});
		}

		const programRows = validRows(PROGRAMS, rows[PROGRAMS], issues);
		const programSummary: SheetSummary = {
			sheet: PROGRAMS,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[PROGRAMS].length - programRows.length,
		};
		const programChanges = programRows.map((r) => {
			const code = normalizeCode(r.values.code);
			const cycleId = r.values.cycleCode
				? (cycleByCode.get(normalizeCode(r.values.cycleCode))?.id ?? null)
				: null;
			const data = programFields(r.values, cycleId);
			const current = programByCode.get(code);
			const changed =
				!current ||
				(Object.keys(data) as (keyof typeof data)[]).some(
					(key) => (current[key] ?? null) !== (data[key] ?? null),
				);
			if (!current) programSummary.create++;
			else if (changed) programSummary.update++;
			else programSummary.unchanged++;
			return { code, data, id: current?.id, changed };
		});
		const knownPrograms = new Set([
			...programByCode.keys(),
			...programChanges.map((p) => p.code),
		]);

		for (const r of rows[OPTIONS]) {
			if (
				r.values.programCode &&
				!knownPrograms.has(normalizeCode(r.values.programCode))
			)
				issues.push({
					sheet: OPTIONS,
					row: r.row,
					column: "Code programme",
					level: "error",
					message: `Programme « ${r.values.programCode} » inconnu : ajoutez-le dans la feuille « ${PROGRAMS} ».`,
				});
		}
		const optionRows = validRows(OPTIONS, rows[OPTIONS], issues);
		const optionSummary: SheetSummary = {
			sheet: OPTIONS,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[OPTIONS].length - optionRows.length,
		};
		const optionChanges = optionRows.map((r) => {
			const programCode = normalizeCode(r.values.programCode);
			const code = r.values.code.trim();
			const program = programByCode.get(programCode);
			const current = program
				? options.find(
						(o) =>
							o.programId === program.id &&
							normalize(o.code) === normalize(code),
					)
				: undefined;
			const data = {
				name: r.values.name,
				description: r.values.description || null,
			};
			const changed =
				!current ||
				current.name !== data.name ||
				(current.description ?? null) !== data.description;
			if (!current) optionSummary.create++;
			else if (changed) optionSummary.update++;
			else optionSummary.unchanged++;
			return { programCode, code, data, id: current?.id, changed };
		});

		return {
			sheets: [programSummary, optionSummary],
			issues,
			async apply(log) {
				const ids = new Map(programs.map((p) => [p.code, p.id]));
				for (const change of programChanges) {
					if (!change.changed) continue;
					if (change.id)
						await db
							.update(schema.programs)
							.set({ ...change.data, slug: slugify(change.data.name) })
							.where(eq(schema.programs.id, change.id));
					else {
						const created = await createProgram(
							{ ...change.data, code: change.code },
							institutionId,
						);
						ids.set(change.code, created.id);
					}
				}
				await log(
					`Programmes : ${programSummary.create} créé(s), ${programSummary.update} mis à jour.`,
				);
				for (const change of optionChanges) {
					if (!change.changed) continue;
					const programId = ids.get(change.programCode);
					if (!programId) continue;
					if (change.id)
						await db
							.update(schema.programOptions)
							.set(change.data)
							.where(eq(schema.programOptions.id, change.id));
					else
						await db
							.insert(schema.programOptions)
							.values({
								...change.data,
								code: change.code,
								programId,
								institutionId,
							})
							.onConflictDoNothing();
				}
				await log(
					`Options : ${optionSummary.create} créée(s), ${optionSummary.update} mise(s) à jour.`,
				);
			},
		};
	},
};
