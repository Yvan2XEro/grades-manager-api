import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import { createClass } from "@/modules/classes/classes.service";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { diff, findDuplicates, normalize, validRows } from "./workbook";
import { requireYear } from "./year-context";

const CLASSES = "Classes";

/** Program, option and level references of the institution, by code. */
async function loadReferences(institutionId: string) {
	const [programs, options, cycles] = await Promise.all([
		db.query.programs.findMany({
			where: eq(schema.programs.institutionId, institutionId),
		}),
		db.query.programOptions.findMany({
			where: eq(schema.programOptions.institutionId, institutionId),
		}),
		db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, institutionId),
			with: { levels: true },
		}),
	]);
	return { programs, options, cycles };
}

/** Classes of an academic year: one row per class (cohort). */
export const classesStep: ImportStepDef = {
	key: "year.classes",
	label: "Classes",
	scope: "year",
	sheets: [
		{
			name: CLASSES,
			description: "Une classe par ligne, pour l'année importée.",
			columns: [
				{
					key: "code",
					header: "Code",
					required: true,
					hint: "Ex. IGL-L1. Unique dans l'année.",
					aliases: ["Code classe", "Class code"],
				},
				{
					key: "name",
					header: "Nom",
					required: true,
					width: 32,
					aliases: ["Nom de la classe", "Name", "Class name", "Libellé"],
				},
				{
					key: "programCode",
					header: "Code programme",
					required: true,
					listFrom: "programs",
					aliases: ["Programme", "Filière", "Program code", "Program"],
				},
				{
					key: "optionCode",
					header: "Code option",
					listFrom: "options",
					hint: "Vide : option par défaut du programme.",
					aliases: ["Option", "Parcours", "Option code"],
				},
				{
					key: "levelCode",
					header: "Code niveau",
					required: true,
					listFrom: "levels",
					hint: "Niveau du cycle du programme (ex. L1, M2).",
					aliases: ["Niveau", "Level", "Level code"],
				},
			],
		},
	],

	async existingRows(ctx) {
		const year = await requireYear(ctx);
		const [classes, refs] = await Promise.all([
			db.query.classes.findMany({
				where: eq(schema.classes.academicYear, year.id),
				orderBy: schema.classes.code,
			}),
			loadReferences(ctx.institutionId),
		]);
		const programCode = new Map(refs.programs.map((p) => [p.id, p.code]));
		const optionCode = new Map(refs.options.map((o) => [o.id, o.code]));
		const levelCode = new Map(
			refs.cycles.flatMap((c) => c.levels.map((l) => [l.id, l.code])),
		);
		return {
			[CLASSES]: classes.map((c) => [
				c.code,
				c.name,
				programCode.get(c.program) ?? "",
				optionCode.get(c.programOptionId) ?? "",
				levelCode.get(c.cycleLevelId) ?? "",
			]),
		};
	},

	async lists({ institutionId }) {
		const refs = await loadReferences(institutionId);
		const unique = (values: string[]) => [...new Set(values)].sort();
		return {
			programs: unique(refs.programs.map((p) => p.code)),
			options: unique(refs.options.map((o) => o.code)),
			levels: unique(refs.cycles.flatMap((c) => c.levels.map((l) => l.code))),
		};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const sheetRows = rows[CLASSES];
		const issues: ImportIssue[] = [
			...findDuplicates(CLASSES, sheetRows, (r) => r.values.code, "Code"),
		];
		const [refs, existing] = await Promise.all([
			loadReferences(ctx.institutionId),
			db.query.classes.findMany({
				where: and(
					eq(schema.classes.academicYear, year.id),
					eq(schema.classes.institutionId, ctx.institutionId),
				),
			}),
		]);
		const programByCode = new Map(refs.programs.map((p) => [p.code, p]));
		const programCode = new Map(refs.programs.map((p) => [p.id, p.code]));
		const levelCode = new Map(
			refs.cycles.flatMap((c) => c.levels.map((l) => [l.id, l.code])),
		);
		const classByCode = new Map(existing.map((c) => [c.code, c]));
		const error = (
			row: number,
			column: string,
			code: string,
			params: Record<string, string | number>,
			message: string,
		) =>
			issues.push({
				sheet: CLASSES,
				row,
				column,
				level: "error",
				code,
				params,
				message,
			});

		type Change = {
			code: string;
			id?: string;
			changed: boolean;
			row: number;
			before?: Record<string, string>;
			after: Record<string, string>;
			data: {
				name: string;
				program: string;
				programOptionId?: string;
				cycleLevelId: string;
			};
		};
		const resolved = new Map<number, Change>();
		for (const r of sheetRows) {
			if (r.invalid) continue;
			const code = normalizeCode(r.values.code);
			const program = programByCode.get(normalizeCode(r.values.programCode));
			if (!program) {
				error(
					r.row,
					"Code programme",
					"unknownProgram",
					{ value: r.values.programCode },
					`Unknown program "${r.values.programCode}": import it in the Foundations first.`,
				);
				continue;
			}
			const cycle = refs.cycles.find((c) => c.id === program.cycleId);
			if (!cycle) {
				error(
					r.row,
					"Code programme",
					"programWithoutCycle",
					{ value: program.code },
					`Program "${program.code}" has no cycle, so its levels are unknown.`,
				);
				continue;
			}
			const level = cycle.levels.find(
				(l) => normalize(l.code) === normalize(r.values.levelCode),
			);
			if (!level) {
				error(
					r.row,
					"Code niveau",
					"unknownLevel",
					{
						value: r.values.levelCode,
						cycle: cycle.code,
						allowed: cycle.levels.map((l) => l.code).join(", "),
					},
					`Level "${r.values.levelCode}" is not a level of cycle ${cycle.code}.`,
				);
				continue;
			}
			let programOptionId: string | undefined;
			if (r.values.optionCode) {
				const option = refs.options.find(
					(o) =>
						o.programId === program.id &&
						normalize(o.code) === normalize(r.values.optionCode),
				);
				if (!option) {
					error(
						r.row,
						"Code option",
						"unknownOption",
						{ value: r.values.optionCode, program: program.code },
						`Option "${r.values.optionCode}" does not exist in program ${program.code}.`,
					);
					continue;
				}
				programOptionId = option.id;
			}
			const current = classByCode.get(code);
			const sameName = existing.find(
				(c) =>
					c.code !== code &&
					c.program === program.id &&
					normalize(c.name) === normalize(r.values.name),
			);
			if (sameName) {
				error(
					r.row,
					"Nom",
					"classNameTaken",
					{ value: r.values.name, code: sameName.code },
					`Name already used by class ${sameName.code} in this program and year.`,
				);
				continue;
			}
			const data = {
				name: r.values.name.trim(),
				program: program.id,
				programOptionId,
				cycleLevelId: level.id,
			};
			const changed =
				!current ||
				current.name !== data.name ||
				current.program !== data.program ||
				current.cycleLevelId !== data.cycleLevelId ||
				(programOptionId !== undefined &&
					current.programOptionId !== programOptionId);
			resolved.set(r.row, {
				code,
				id: current?.id,
				changed,
				data,
				row: r.row,
				before: current
					? {
							Nom: current.name,
							"Code programme": programCode.get(current.program) ?? "",
							"Code niveau": levelCode.get(current.cycleLevelId) ?? "",
						}
					: undefined,
				after: {
					Nom: data.name,
					"Code programme": program.code,
					"Code niveau": level.code,
				},
			});
		}

		const valid = validRows(CLASSES, sheetRows, issues);
		const changes = valid
			.map((r) => resolved.get(r.row))
			.filter((c): c is Change => Boolean(c));
		const summary: SheetSummary = {
			sheet: CLASSES,
			create: changes.filter((c) => !c.id).length,
			update: changes.filter((c) => c.id && c.changed).length,
			unchanged: changes.filter((c) => c.id && !c.changed).length,
			skipped: sheetRows.length - changes.length,
		};

		return {
			sheets: [summary],
			issues,
			changes: changes
				.filter((c) => c.changed)
				.map((c) => ({
					sheet: CLASSES,
					row: c.row,
					action: c.id ? "update" : "create",
					label: c.code,
					before: c.before && diff(c.before, c.after),
					after: c.before ? diff(c.after, c.before) : c.after,
				})),
			async apply(log) {
				for (const change of changes) {
					if (!change.changed) continue;
					if (change.id) {
						const { programOptionId, ...rest } = change.data;
						await db
							.update(schema.classes)
							.set(programOptionId ? { ...rest, programOptionId } : rest)
							.where(eq(schema.classes.id, change.id));
					} else
						await createClass(
							{
								...change.data,
								code: change.code,
								academicYear: year.id,
								totalCredits: 0,
							},
							ctx.institutionId,
						);
				}
				await log(
					`Classes: ${summary.create} created, ${summary.update} updated.`,
				);
			},
		};
	},
};
