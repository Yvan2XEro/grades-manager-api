#!/usr/bin/env bun
import { db } from "@/db";
import { DEFAULT_MENTION_RANGES } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

export async function backfillGradeScales() {
	const institutions = await db.query.institutions.findMany({
		columns: { id: true, code: true },
	});

	if (!institutions.length) {
		console.log("[backfill] No institutions found — nothing to backfill.");
		return;
	}

	const instById = Object.fromEntries(institutions.map((i) => [i.id, i.code]));

	const inserted = await db
		.insert(schema.gradeScales)
		.values(
			institutions.map((inst) => ({
				institutionId: inst.id,
				passThreshold: "10",
				compensationThreshold: "8",
				mentionRanges: DEFAULT_MENTION_RANGES,
			})),
		)
		.onConflictDoNothing()
		.returning({ institutionId: schema.gradeScales.institutionId });

	for (const row of inserted) {
		console.log(
			`[backfill] Created default grade scale for institution ${instById[row.institutionId]} (${row.institutionId})`,
		);
	}

	console.log(
		`[backfill] Grade scales: created ${inserted.length}, skipped ${institutions.length - inserted.length} already configured.`,
	);
}

// Only run when invoked directly as a script
if (import.meta.main) {
	backfillGradeScales()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Backfill failed:", err);
			process.exit(1);
		});
}
