import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { overrideDecision } from "@/modules/deliberations/deliberations.service";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";
import { requireYear } from "./year-context";

const DECISIONS = "Décisions";

/** Decision labels found in results reports ↔ stored decisions. */
const DECISION_NAMES: Record<string, schema.DeliberationDecision> = {
	admis: "admitted",
	admise: "admitted",
	adm: "admitted",
	admitted: "admitted",
	passed: "admitted",
	compense: "compensated",
	"admis par compensation": "compensated",
	adc: "compensated",
	compensated: "compensated",
	ajourne: "deferred",
	ajournee: "deferred",
	aj: "deferred",
	ajr: "deferred",
	deferred: "deferred",
	redouble: "repeat",
	redoublant: "repeat",
	red: "repeat",
	repeat: "repeat",
	exclu: "excluded",
	exclue: "excluded",
	exc: "excluded",
	excluded: "excluded",
};

/** Annual deliberation results of the year, by registration number. */
async function loadResults(institutionId: string, academicYearId: string) {
	const delibs = await db.query.deliberations.findMany({
		where: and(
			eq(schema.deliberations.institutionId, institutionId),
			eq(schema.deliberations.academicYearId, academicYearId),
			eq(schema.deliberations.type, "annual"),
		),
	});
	if (!delibs.length) return { delibs, results: [] };
	const results = await db
		.select({
			id: schema.deliberationStudentResults.id,
			deliberationId: schema.deliberationStudentResults.deliberationId,
			finalDecision: schema.deliberationStudentResults.finalDecision,
			autoDecision: schema.deliberationStudentResults.autoDecision,
			isOverridden: schema.deliberationStudentResults.isOverridden,
			overrideReason: schema.deliberationStudentResults.overrideReason,
			overriddenBy: schema.deliberationStudentResults.overriddenBy,
			registrationNumber: schema.students.registrationNumber,
		})
		.from(schema.deliberationStudentResults)
		.innerJoin(
			schema.students,
			eq(schema.students.id, schema.deliberationStudentResults.studentId),
		)
		.where(
			inArray(
				schema.deliberationStudentResults.deliberationId,
				delibs.map((d) => d.id),
			),
		);
	return { delibs, results };
}

/**
 * Official jury decisions of a past year (from its results reports), compared
 * with the decisions computed from the imported grades. A gap usually reveals
 * a missing grade or a misconfigured rule; importing keeps the official
 * decision as a traced override.
 */
export const decisionsStep: ImportStepDef = {
	key: "year.decisions",
	label: "Décisions officielles",
	scope: "year",
	sheets: [
		{
			name: DECISIONS,
			description:
				"Facultatif, après la clôture de l'année : la décision du jury de chaque étudiant, telle qu'elle figure au procès-verbal. Les écarts avec les décisions calculées sont signalés ; importer retient la décision officielle.",
			columns: [
				{
					key: "registrationNumber",
					header: "Matricule",
					required: true,
					aliases: ["N° matricule", "Mat.", "Registration number"],
				},
				{
					key: "decision",
					header: "Décision",
					required: true,
					hint: "Admis, Admis par compensation, Ajourné, Redouble, Exclu (ou ADM, ADC, AJ, RED, EXC).",
					aliases: ["Décision du jury", "Decision"],
				},
				{
					key: "reason",
					header: "Motif",
					width: 28,
					aliases: ["Observation", "Reason"],
				},
			],
		},
	],

	async existingRows() {
		return {};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const sheetRows = rows[DECISIONS];
		const issues: ImportIssue[] = [
			...findDuplicates(
				DECISIONS,
				sheetRows,
				(r) => r.values.registrationNumber,
				"Matricule",
			),
		];
		const { delibs, results } = await loadResults(ctx.institutionId, year.id);
		const delibById = new Map(delibs.map((d) => [d.id, d]));
		const resultByReg = new Map(
			results.map((r) => [r.registrationNumber.trim().toUpperCase(), r]),
		);
		if (!delibs.length)
			issues.push({
				sheet: DECISIONS,
				row: 0,
				level: "error",
				code: "yearNotClosed",
				params: { year: year.name },
				message: `${year.name} has no computed deliberation yet: close the year first.`,
			});

		const changes: {
			resultId: string;
			deliberationId: string;
			decision: schema.DeliberationDecision;
			reason: string;
		}[] = [];
		const summary: SheetSummary = {
			sheet: DECISIONS,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: 0,
		};
		const issue = (
			row: number,
			column: string,
			level: "error" | "warning",
			code: string,
			params: Record<string, string | number>,
			message: string,
		) =>
			issues.push({
				sheet: DECISIONS,
				row,
				column,
				level,
				code,
				params,
				message,
			});
		for (const r of sheetRows) {
			if (r.invalid || !delibs.length) continue;
			const v = r.values;
			const decision = DECISION_NAMES[normalize(v.decision)];
			if (!decision) {
				issue(
					r.row,
					"Décision",
					"error",
					"unknownDecision",
					{ value: v.decision },
					`"${v.decision}" is not a known jury decision.`,
				);
				continue;
			}
			const result = resultByReg.get(v.registrationNumber.trim().toUpperCase());
			if (!result) {
				issue(
					r.row,
					"Matricule",
					"error",
					"noDeliberationResult",
					{ value: v.registrationNumber, year: year.name },
					`No deliberation result for ${v.registrationNumber} in ${year.name}.`,
				);
				continue;
			}
			if (delibById.get(result.deliberationId)?.status !== "open") {
				issue(
					r.row,
					"Matricule",
					"error",
					"deliberationNotOpen",
					{ value: v.registrationNumber },
					"The deliberation of this student is closed: it cannot be changed.",
				);
				continue;
			}
			if (result.finalDecision === decision) continue;
			issue(
				r.row,
				"Décision",
				"warning",
				"decisionGap",
				{ value: v.decision, computed: result.finalDecision ?? "" },
				`Official decision "${v.decision}" differs from the computed one (${result.finalDecision}).`,
			);
			changes.push({
				resultId: result.id,
				deliberationId: result.deliberationId,
				decision,
				reason: v.reason || "Official decision (import)",
			});
		}
		const valid = validRows(DECISIONS, sheetRows, issues);
		summary.update = changes.length;
		summary.unchanged = valid.length - changes.length;
		summary.skipped = sheetRows.length - valid.length;

		return {
			sheets: [summary],
			issues,
			async apply(log, journal) {
				if (!ctx.actorId) throw new Error("An actor is required to override");
				const resultById = new Map(results.map((r) => [r.id, r]));
				for (const change of changes) {
					journal.updated(
						"deliberationStudentResults",
						change.resultId,
						resultById.get(change.resultId)!,
						{
							finalDecision: true,
							isOverridden: true,
							overrideReason: true,
							overriddenBy: true,
						},
					);
					await overrideDecision(
						{
							deliberationId: change.deliberationId,
							studentResultId: change.resultId,
							finalDecision: change.decision,
							reason: change.reason,
						},
						ctx.institutionId,
						ctx.actorId,
					);
				}
				await log(`Decisions: ${changes.length} official decision(s) kept.`);
			},
		};
	},
};
