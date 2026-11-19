import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";
import { isPastYear, requireYear } from "./year-context";

const MODEL = "Modèle";
const EXCEPTIONS = "Exceptions";
const YES = new Set(["oui", "o", "yes", "y", "x", "1"]);
const POLICIES: Record<string, schema.RetakeScoringPolicy> = {
	remplace: "replace",
	replace: "replace",
	"meilleure note": "best_of",
	meilleure: "best_of",
	best: "best_of",
	best_of: "best_of",
};
const isRetakeName = (name: string) => /rattrap|retake|reprise/i.test(name);

/** Class courses of the year with their class and course codes, and their exams. */
async function loadYear(institutionId: string, academicYearId: string) {
	const classCourses = await db
		.select({
			id: schema.classCourses.id,
			classCode: schema.classes.code,
			courseCode: schema.courses.code,
			courseName: schema.courses.name,
		})
		.from(schema.classCourses)
		.innerJoin(schema.classes, eq(schema.classes.id, schema.classCourses.class))
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.where(
			and(
				eq(schema.classes.academicYear, academicYearId),
				eq(schema.classes.institutionId, institutionId),
			),
		);
	const exams = classCourses.length
		? await db.query.exams.findMany({
				where: inArray(
					schema.exams.classCourse,
					classCourses.map((cc) => cc.id),
				),
			})
		: [];
	return { classCourses, exams };
}

/** One component of the evaluation model (or of a course exception). */
type Component = {
	type: string;
	percentage: number;
	retakeOf?: string;
	policy: schema.RetakeScoringPolicy;
};

/**
 * Exams of the year, generated from an evaluation model applied to every
 * class course (e.g. CA 40 % + Exam 60 % + Retake replacing the Exam). The
 * "Exceptions" sheet changes a weight or a date, or drops an exam, for one
 * course. A course has at most one exam per type.
 */
export const examsStep: ImportStepDef = {
	key: "year.exams",
	label: "Examens",
	scope: "year",
	sheets: [
		{
			name: MODEL,
			description:
				"Le modèle d'évaluation appliqué à tous les cours de l'année : un type d'examen par ligne avec sa pondération. Un rattrapage indique l'examen qu'il remplace.",
			columns: [
				{
					key: "type",
					header: "Type d'examen",
					required: true,
					listFrom: "examTypes",
					aliases: ["Type", "Examen", "Exam type"],
				},
				{
					key: "percentage",
					header: "Pondération (%)",
					type: "number",
					hint: "Vide pour un rattrapage (il prend la pondération de l'examen remplacé).",
					aliases: ["Pondération", "Poids", "%", "Weight"],
				},
				{
					key: "retakeOf",
					header: "Rattrapage de",
					listFrom: "examTypes",
					hint: "Pour un rattrapage : le type d'examen qu'il remplace (ex. Examen).",
					aliases: ["Remplace", "Retake of"],
				},
				{
					key: "policy",
					header: "Note retenue",
					enum: ["remplace", "meilleure note"],
					hint: "Rattrapage : la note remplace celle de l'examen, ou la meilleure des deux est gardée.",
					aliases: ["Politique", "Policy"],
				},
			],
		},
		{
			name: EXCEPTIONS,
			description:
				"Facultatif : une ligne par examen d'un cours qui s'écarte du modèle (pondération, date) ou qui n'a pas lieu.",
			columns: [
				{
					key: "classCode",
					header: "Code classe",
					required: true,
					listFrom: "classes",
					aliases: ["Classe", "Class"],
				},
				{
					key: "courseCode",
					header: "Code EC",
					required: true,
					listFrom: "courses",
					aliases: ["EC", "Course code"],
				},
				{
					key: "type",
					header: "Type d'examen",
					required: true,
					listFrom: "examTypes",
					aliases: ["Type", "Exam type"],
				},
				{
					key: "percentage",
					header: "Pondération (%)",
					type: "number",
					aliases: ["Pondération", "Poids", "Weight"],
				},
				{
					key: "date",
					header: "Date",
					type: "date",
					hint: "jj/mm/aaaa",
				},
				{
					key: "remove",
					header: "N'a pas lieu",
					hint: "« oui » : cet examen n'est pas créé pour ce cours.",
					aliases: ["Retirer", "Not held"],
				},
			],
		},
	],

	async existingRows(ctx) {
		const year = await requireYear(ctx);
		const types = await db.query.examTypes.findMany({
			where: eq(schema.examTypes.institutionId, ctx.institutionId),
		});
		const { exams } = await loadYear(ctx.institutionId, year.id);
		// The model in use: weight of each type in this year's exams, else the
		// defaults of the institution's exam types
		const weights = new Map<string, number>();
		const retakes = new Map<string, { of: string; policy: string }>();
		const byId = new Map(exams.map((e) => [e.id, e]));
		for (const exam of exams) {
			if (exam.sessionType === "retake") {
				const parent = exam.parentExamId ? byId.get(exam.parentExamId) : null;
				if (parent)
					retakes.set(exam.type, {
						of: parent.type,
						policy:
							exam.scoringPolicy === "best_of" ? "meilleure note" : "remplace",
					});
			} else if (!weights.has(exam.type))
				weights.set(exam.type, Number(exam.percentage));
		}
		const model: string[][] = weights.size
			? [
					...[...weights].map(([type, w]) => [type, String(w), "", ""]),
					...[...retakes].map(([type, r]) => [type, "", r.of, r.policy]),
				]
			: (() => {
					const normal = types.filter((t) => !isRetakeName(t.name));
					const main = [...normal].sort(
						(a, b) => (b.defaultPercentage ?? 0) - (a.defaultPercentage ?? 0),
					)[0];
					// Types without a default weight share what is left of 100 %
					const set = normal.filter((t) => t.defaultPercentage != null);
					const rest = Math.max(
						100 - set.reduce((n, t) => n + (t.defaultPercentage ?? 0), 0),
						0,
					);
					const unset = normal.length - set.length;
					const share = unset ? Math.round((rest / unset) * 100) / 100 : 0;
					return [
						...normal.map((t) => [
							t.name,
							String(t.defaultPercentage ?? share),
							"",
							"",
						]),
						...types
							.filter((t) => isRetakeName(t.name) && main)
							.map((t) => [t.name, "", main.name, "remplace"]),
					];
				})();
		return { [MODEL]: model, [EXCEPTIONS]: [] };
	},

	async lists(ctx) {
		const year = await requireYear(ctx);
		const [types, { classCourses }] = await Promise.all([
			db.query.examTypes.findMany({
				where: eq(schema.examTypes.institutionId, ctx.institutionId),
			}),
			loadYear(ctx.institutionId, year.id),
		]);
		return {
			examTypes: types.map((t) => t.name).sort(),
			classes: [...new Set(classCourses.map((c) => c.classCode))].sort(),
			courses: [...new Set(classCourses.map((c) => c.courseCode))].sort(),
		};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const issues: ImportIssue[] = [
			...findDuplicates(
				MODEL,
				rows[MODEL],
				(r) => r.values.type,
				"Type d'examen",
			),
			...findDuplicates(
				EXCEPTIONS,
				rows[EXCEPTIONS],
				(r) => `${r.values.classCode}|${r.values.courseCode}|${r.values.type}`,
				"Type d'examen",
			),
		];
		const push = (
			sheet: string,
			row: number,
			column: string | undefined,
			level: "error" | "warning",
			code: string,
			params: Record<string, string | number>,
			message: string,
		) => issues.push({ sheet, row, column, level, code, params, message });

		// The model
		const model: Component[] = [];
		const modelTypes = new Set(
			rows[MODEL]
				.filter((r) => !r.values.retakeOf)
				.map((r) => normalize(r.values.type)),
		);
		for (const r of rows[MODEL]) {
			if (r.invalid) continue;
			const v = r.values;
			if (v.retakeOf) {
				if (!modelTypes.has(normalize(v.retakeOf))) {
					push(
						MODEL,
						r.row,
						"Rattrapage de",
						"error",
						"unknownRetakeTarget",
						{ value: v.retakeOf },
						`"${v.retakeOf}" is not an exam type of the model.`,
					);
					continue;
				}
			} else if (!v.percentage) {
				push(
					MODEL,
					r.row,
					"Pondération (%)",
					"error",
					"required",
					{},
					"Required value missing.",
				);
				continue;
			}
			model.push({
				type: v.type.trim(),
				percentage: Number((v.percentage || "0").replace(",", ".")),
				retakeOf: v.retakeOf
					? rows[MODEL]
							.find((m) => normalize(m.values.type) === normalize(v.retakeOf))
							?.values.type.trim()
					: undefined,
				policy: POLICIES[normalize(v.policy ?? "")] ?? "replace",
			});
		}
		const total = model
			.filter((c) => !c.retakeOf)
			.reduce((n, c) => n + c.percentage, 0);
		if (model.length && Math.abs(total - 100) > 0.01)
			push(
				MODEL,
				0,
				undefined,
				"warning",
				"weightsNot100",
				{ total },
				`The weights of the model add up to ${total} %, not 100 %.`,
			);

		const { classCourses, exams } = await loadYear(ctx.institutionId, year.id);
		if (!classCourses.length)
			push(
				MODEL,
				0,
				undefined,
				"error",
				"noClassCourses",
				{ year: year.name },
				`${year.name} has no class courses yet: import them at the Class courses step.`,
			);

		// Exceptions, per class course
		type Exception = { percentage?: number; date?: string; remove: boolean };
		const exceptions = new Map<string, Map<string, Exception>>();
		for (const r of rows[EXCEPTIONS]) {
			if (r.invalid) continue;
			const v = r.values;
			const cc = classCourses.find(
				(c) =>
					c.classCode === normalizeCode(v.classCode) &&
					normalize(c.courseCode) === normalize(v.courseCode),
			);
			if (!cc) {
				push(
					EXCEPTIONS,
					r.row,
					"Code EC",
					"error",
					"unknownClassCourse",
					{ class: v.classCode, course: v.courseCode },
					`Course ${v.courseCode} is not taught in class ${v.classCode}.`,
				);
				continue;
			}
			const perCourse = exceptions.get(cc.id) ?? new Map();
			perCourse.set(normalize(v.type), {
				percentage: v.percentage
					? Number(v.percentage.replace(",", "."))
					: undefined,
				date: v.date || undefined,
				remove: YES.has(normalize(v.remove ?? "")),
			});
			exceptions.set(cc.id, perCourse);
		}
		// Valid rows only (errors above drop their row)
		validRows(EXCEPTIONS, rows[EXCEPTIONS], issues);

		const status = isPastYear(year) ? "approved" : "draft";
		const defaultDate = new Date(year.endDate);
		type Change = {
			classCourseId: string;
			id?: string;
			name: string;
			component: Component;
			percentage: string;
			date: Date;
		};
		const changes: Change[] = [];
		const summary: SheetSummary = {
			// Counts exams, not rows of the model
			sheet: "Examens",
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: 0,
		};
		for (const cc of classCourses) {
			const own = exceptions.get(cc.id);
			for (const component of model) {
				const exception = own?.get(normalize(component.type));
				if (exception?.remove) {
					summary.skipped++;
					continue;
				}
				const percentage = (
					exception?.percentage ?? component.percentage
				).toFixed(2);
				const date = exception?.date ? new Date(exception.date) : defaultDate;
				const current = exams.find(
					(e) =>
						e.classCourse === cc.id &&
						normalize(e.type) === normalize(component.type),
				);
				const differs =
					current &&
					((!component.retakeOf &&
						Number(current.percentage) !== Number(percentage)) ||
						(exception?.date &&
							current.date.toISOString().slice(0, 10) !== exception.date));
				if (current?.isLocked && differs) {
					summary.skipped++;
					push(
						MODEL,
						0,
						undefined,
						"warning",
						"examLocked",
						{ course: cc.courseCode, type: current.type },
						`The ${current.type} exam of ${cc.courseCode} is locked: left unchanged.`,
					);
					continue;
				}
				if (!current) summary.create++;
				else if (
					(!component.retakeOf &&
						Number(current.percentage) !== Number(percentage)) ||
					(exception?.date &&
						current.date.toISOString().slice(0, 10) !== exception.date)
				)
					summary.update++;
				else {
					summary.unchanged++;
					continue;
				}
				changes.push({
					classCourseId: cc.id,
					id: current?.id,
					name: `${cc.courseName} - ${component.type}`,
					component,
					percentage,
					date,
				});
			}
		}

		// Exams of a course outside the model (another type) keep counting in
		// its average: flag courses whose weights would exceed 100 %.
		for (const cc of classCourses) {
			const own = exceptions.get(cc.id);
			let total = 0;
			for (const component of model) {
				if (component.retakeOf) continue;
				const exception = own?.get(normalize(component.type));
				if (exception?.remove) continue;
				total += exception?.percentage ?? component.percentage;
			}
			const extra = exams.filter(
				(e) =>
					e.classCourse === cc.id &&
					e.sessionType !== "retake" &&
					!model.some((c) => normalize(c.type) === normalize(e.type)),
			);
			for (const e of extra) total += Number(e.percentage);
			if (extra.length && total > 100.01)
				push(
					MODEL,
					0,
					undefined,
					"warning",
					"courseWeightsOver100",
					{
						course: cc.courseCode,
						total: Number(total.toFixed(2)),
						exams: extra.map((e) => e.type).join(", "),
					},
					`${cc.courseCode}: with its other exams (${extra.map((e) => e.type).join(", ")}) the weights add up to ${total.toFixed(2)} %. Remove them or adjust the model.`,
				);
		}

		// Detail of the review: one line per exam created or changed
		const ccById = new Map(classCourses.map((cc) => [cc.id, cc]));
		const rowChanges = changes.map((c) => {
			const cc = ccById.get(c.classCourseId);
			const current = c.id ? exams.find((e) => e.id === c.id) : undefined;
			return {
				sheet: MODEL,
				row: 0,
				action: c.id ? ("update" as const) : ("create" as const),
				label: `${cc?.classCode ?? ""} · ${cc?.courseCode ?? ""} — ${c.component.type}`,
				...(current
					? {
							before: {
								Pondération: `${Number(current.percentage)} %`,
								Date: current.date.toISOString().slice(0, 10),
							},
						}
					: {}),
				after: {
					Pondération: `${Number(c.percentage)} %`,
					Date: c.date.toISOString().slice(0, 10),
				},
			};
		});

		return {
			sheets: [summary],
			issues,
			changes: rowChanges,
			async apply(log, journal) {
				// Exam types of the model that the institution does not have yet
				const types = await db.query.examTypes.findMany({
					where: eq(schema.examTypes.institutionId, ctx.institutionId),
				});
				for (const component of model)
					if (
						!types.some((t) => normalize(t.name) === normalize(component.type))
					)
						await db
							.insert(schema.examTypes)
							.values({
								institutionId: ctx.institutionId,
								name: component.type,
								defaultPercentage: component.retakeOf
									? null
									: Math.round(component.percentage),
							})
							.onConflictDoNothing();

				const examId = new Map(
					exams.map((e) => [`${e.classCourse}|${normalize(e.type)}`, e.id]),
				);
				// Main exams first: a retake points to the exam it replaces
				const ordered = [
					...changes.filter((c) => !c.component.retakeOf),
					...changes.filter((c) => c.component.retakeOf),
				];
				for (const change of ordered) {
					const { component } = change;
					const parentId = component.retakeOf
						? examId.get(
								`${change.classCourseId}|${normalize(component.retakeOf)}`,
							)
						: undefined;
					// A retake weighs what the exam it replaces weighs
					const replaced = component.retakeOf
						? model.find(
								(c) =>
									!c.retakeOf &&
									normalize(c.type) === normalize(component.retakeOf ?? ""),
							)
						: undefined;
					const percentage = replaced
						? replaced.percentage.toFixed(2)
						: change.percentage;
					if (change.id) {
						journal.updated(
							"exams",
							change.id,
							exams.find((e) => e.id === change.id)!,
							{ percentage, date: change.date },
						);
						await db
							.update(schema.exams)
							.set({ percentage, date: change.date })
							.where(eq(schema.exams.id, change.id));
						continue;
					}
					const [created] = await db
						.insert(schema.exams)
						.values({
							institutionId: ctx.institutionId,
							name: change.name,
							type: component.type,
							date: change.date,
							percentage,
							classCourse: change.classCourseId,
							status,
							sessionType: component.retakeOf ? "retake" : "normal",
							parentExamId: parentId ?? null,
							scoringPolicy: component.policy,
						})
						.returning({ id: schema.exams.id });
					journal.created("exams", [created.id]);
					examId.set(
						`${change.classCourseId}|${normalize(component.type)}`,
						created.id,
					);
				}
				await log(
					`Exams: ${summary.create} created, ${summary.update} updated.`,
				);
			},
		};
	},
};
