#!/usr/bin/env bun
import { sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

async function run() {
	console.log("\n=== DIAGNOSTIC EXAMS / PONDERATIONS ===\n");

	const total = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.exams);
	console.log(`[1] Total exams en DB: ${total[0]?.count ?? 0}`);

	const byType = await db
		.select({
			type: schema.exams.type,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.exams)
		.groupBy(schema.exams.type);
	console.log("[2] Répartition par type:");
	for (const row of byType) {
		console.log(`     - ${row.type}: ${row.count}`);
	}

	const byStatus = await db
		.select({
			status: schema.exams.status,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.exams)
		.groupBy(schema.exams.status);
	console.log("\n[3] Répartition par status:");
	for (const row of byStatus) {
		console.log(`     - ${row.status}: ${row.count}`);
	}

	// Per class_course percentage breakdown
	const perCC = await db
		.select({
			classCourseId: schema.exams.classCourse,
			type: schema.exams.type,
			percentage: schema.exams.percentage,
		})
		.from(schema.exams);

	const ccTotals = new Map<string, { total: number; types: string[] }>();
	for (const row of perCC) {
		const cur = ccTotals.get(row.classCourseId) ?? { total: 0, types: [] };
		cur.total += Number(row.percentage);
		cur.types.push(`${row.type}=${row.percentage}`);
		ccTotals.set(row.classCourseId, cur);
	}

	console.log("\n[4] Class_courses avec exams (top 15):");
	const sorted = Array.from(ccTotals.entries())
		.sort((a, b) => b[1].total - a[1].total)
		.slice(0, 15);
	for (const [ccId, info] of sorted) {
		console.log(
			`     - ${ccId.slice(0, 12)}…: total=${info.total}% [${info.types.join(", ")}]`,
		);
	}

	const overLimit = Array.from(ccTotals.values()).filter((v) => v.total >= 60);
	console.log(
		`\n[5] Class_courses où ajout d'un CC@40% dépasserait 100%: ${overLimit.length}`,
	);

	// Detect ENORMOUS percentages (e.g. seed gone wrong)
	const huge = Array.from(ccTotals.entries()).filter(([, v]) => v.total > 100);
	if (huge.length) {
		console.log(
			`\n[6] ⚠ ${huge.length} class_courses ont déjà un total > 100% — anomalie:`,
		);
		for (const [ccId, info] of huge.slice(0, 10)) {
			console.log(
				`     - ${ccId.slice(0, 12)}…: ${info.total}% [${info.types.join(", ")}]`,
			);
		}
	}

	console.log("\n=== FIN ===\n");
}

run()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
