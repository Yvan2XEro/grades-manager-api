import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { normalizeCode } from "@/lib/strings";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, validRows } from "./workbook";

const CYCLES = "Cycles";
const LEVELS = "Niveaux";

const int = (value: string, fallback: number) =>
	value ? Number.parseInt(value, 10) : fallback;

/** Cycles (Licence, Master, BTS…) and their levels (L1, L2, M1…). */
export const cyclesStep: ImportStepDef = {
	key: "foundation.cycles",
	label: "Cycles & niveaux",
	sheets: [
		{
			name: CYCLES,
			description: "Un cycle par ligne (Licence, Master, BTS…).",
			columns: [
				{
					key: "code",
					header: "Code",
					required: true,
					hint: "Ex. LIC, MAS, BTS",
				},
				{ key: "name", header: "Nom", required: true, width: 28 },
				{ key: "nameEn", header: "Nom (anglais)", width: 24 },
				{
					key: "durationYears",
					header: "Durée (années)",
					required: true,
					type: "integer",
				},
				{
					key: "credits",
					header: "Crédits requis",
					type: "integer",
					hint: "180 pour une Licence LMD",
				},
			],
		},
		{
			name: LEVELS,
			description: "Les niveaux de chaque cycle, dans l'ordre (L1, L2, L3…).",
			columns: [
				{
					key: "cycleCode",
					header: "Code cycle",
					required: true,
					listFrom: "cycles",
				},
				{
					key: "code",
					header: "Code niveau",
					required: true,
					hint: "Ex. L1, L2, M1",
				},
				{ key: "name", header: "Nom", required: true, width: 24 },
				{
					key: "order",
					header: "Ordre",
					required: true,
					type: "integer",
					hint: "1 pour la première année du cycle",
				},
				{
					key: "minCredits",
					header: "Crédits minimum",
					type: "integer",
					hint: "60 par défaut",
				},
			],
		},
	],

	async existingRows({ institutionId }) {
		const cycles = await db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, institutionId),
			orderBy: schema.studyCycles.code,
		});
		const levels = cycles.length
			? await db.query.cycleLevels.findMany({
					where: inArray(
						schema.cycleLevels.cycleId,
						cycles.map((c) => c.id),
					),
				})
			: [];
		const codeOf = new Map(cycles.map((c) => [c.id, c.code]));
		return {
			[CYCLES]: cycles.map((c) => [
				c.code,
				c.name,
				c.nameEn ?? "",
				String(c.durationYears),
				String(c.totalCreditsRequired),
			]),
			[LEVELS]: levels
				.sort(
					(a, b) =>
						(codeOf.get(a.cycleId) ?? "").localeCompare(
							codeOf.get(b.cycleId) ?? "",
						) || a.orderIndex - b.orderIndex,
				)
				.map((l) => [
					codeOf.get(l.cycleId) ?? "",
					l.code,
					l.name,
					String(l.orderIndex),
					String(l.minCredits),
				]),
		};
	},

	async lists({ institutionId }) {
		const cycles = await db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, institutionId),
		});
		return { cycles: cycles.map((c) => c.code).sort() };
	},

	async plan(rows, { institutionId }) {
		const issues: ImportIssue[] = [
			...findDuplicates(CYCLES, rows[CYCLES], (r) => r.values.code, "Code"),
			...findDuplicates(
				LEVELS,
				rows[LEVELS],
				(r) => `${r.values.cycleCode}|${r.values.code}`,
				"Code niveau",
			),
			...findDuplicates(
				LEVELS,
				rows[LEVELS],
				(r) => `${r.values.cycleCode}|${r.values.order}`,
				"Ordre",
			),
		];
		const existing = await db.query.studyCycles.findMany({
			where: eq(schema.studyCycles.institutionId, institutionId),
		});
		const cycleByCode = new Map(existing.map((c) => [c.code, c]));
		const existingLevels = existing.length
			? await db.query.cycleLevels.findMany({
					where: inArray(
						schema.cycleLevels.cycleId,
						existing.map((c) => c.id),
					),
				})
			: [];

		// Cycles
		const cycleRows = validRows(CYCLES, rows[CYCLES], issues).map((r) => ({
			code: normalizeCode(r.values.code),
			name: r.values.name,
			nameEn: r.values.nameEn || null,
			durationYears: int(r.values.durationYears, 3),
			totalCreditsRequired: int(r.values.credits, 180),
		}));
		const cycleSummary: SheetSummary = {
			sheet: CYCLES,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[CYCLES].length - cycleRows.length,
		};
		const cycleChanges = cycleRows.map((data) => {
			const current = cycleByCode.get(data.code);
			const changed =
				!current ||
				current.name !== data.name ||
				(current.nameEn ?? null) !== data.nameEn ||
				current.durationYears !== data.durationYears ||
				current.totalCreditsRequired !== data.totalCreditsRequired;
			if (!current) cycleSummary.create++;
			else if (changed) cycleSummary.update++;
			else cycleSummary.unchanged++;
			return { data, id: current?.id, changed };
		});
		const knownCycles = new Set([
			...cycleByCode.keys(),
			...cycleRows.map((c) => c.code),
		]);

		// Levels
		for (const r of rows[LEVELS]) {
			if (
				r.values.cycleCode &&
				!knownCycles.has(normalizeCode(r.values.cycleCode))
			)
				issues.push({
					sheet: LEVELS,
					row: r.row,
					column: "Code cycle",
					level: "error",
					message: `Cycle « ${r.values.cycleCode} » inconnu : ajoutez-le dans la feuille « ${CYCLES} ».`,
				});
		}
		const levelRows = validRows(LEVELS, rows[LEVELS], issues);
		const levelSummary: SheetSummary = {
			sheet: LEVELS,
			create: 0,
			update: 0,
			unchanged: 0,
			skipped: rows[LEVELS].length - levelRows.length,
		};
		const levelChanges = levelRows.flatMap((r) => {
			const cycleCode = normalizeCode(r.values.cycleCode);
			const cycle = cycleByCode.get(cycleCode);
			const data = {
				code: normalizeCode(r.values.code),
				name: r.values.name,
				orderIndex: int(r.values.order, 1),
				minCredits: int(r.values.minCredits, 60),
			};
			const current = cycle
				? existingLevels.find(
						(l) => l.cycleId === cycle.id && l.code === data.code,
					)
				: undefined;
			const orderTaken = cycle
				? existingLevels.find(
						(l) =>
							l.cycleId === cycle.id &&
							l.orderIndex === data.orderIndex &&
							l.code !== data.code,
					)
				: undefined;
			if (orderTaken) {
				issues.push({
					sheet: LEVELS,
					row: r.row,
					column: "Ordre",
					level: "error",
					message: `L'ordre ${data.orderIndex} est déjà pris par le niveau « ${orderTaken.code} » de ce cycle.`,
				});
				levelSummary.skipped++;
				return [];
			}
			const changed =
				!current ||
				current.name !== data.name ||
				current.orderIndex !== data.orderIndex ||
				current.minCredits !== data.minCredits;
			if (!current) levelSummary.create++;
			else if (changed) levelSummary.update++;
			else levelSummary.unchanged++;
			return [{ cycleCode, data, id: current?.id, changed }];
		});

		return {
			sheets: [cycleSummary, levelSummary],
			issues,
			async apply(log) {
				const ids = new Map(existing.map((c) => [c.code, c.id]));
				for (const change of cycleChanges) {
					if (!change.changed) continue;
					if (change.id)
						await db
							.update(schema.studyCycles)
							.set(change.data)
							.where(eq(schema.studyCycles.id, change.id));
					else {
						const [created] = await db
							.insert(schema.studyCycles)
							.values({ ...change.data, institutionId })
							.returning({ id: schema.studyCycles.id });
						ids.set(change.data.code, created.id);
					}
				}
				await log(
					`Cycles : ${cycleSummary.create} créé(s), ${cycleSummary.update} mis à jour.`,
				);
				for (const change of levelChanges) {
					if (!change.changed) continue;
					const cycleId = ids.get(change.cycleCode);
					if (!cycleId) continue;
					if (change.id)
						await db
							.update(schema.cycleLevels)
							.set(change.data)
							.where(eq(schema.cycleLevels.id, change.id));
					else {
						const clash = await db.query.cycleLevels.findFirst({
							where: and(
								eq(schema.cycleLevels.cycleId, cycleId),
								eq(schema.cycleLevels.code, change.data.code),
							),
						});
						if (clash) continue;
						await db
							.insert(schema.cycleLevels)
							.values({ ...change.data, cycleId });
					}
				}
				await log(
					`Niveaux : ${levelSummary.create} créé(s), ${levelSummary.update} mis à jour.`,
				);
			},
		};
	},
};
