#!/usr/bin/env bun
import { db } from "@/db";
import { DEFAULT_MENTION_RANGES } from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

export async function backfillGradeScales() {
	const institutions = await db.query.institutions.findMany({
		columns: { id: true, code: true },
	});

	if (!institutions.length) {
		console.log("No institutions found — nothing to backfill.");
		return;
	}

	const existing = await db.query.gradeScales.findMany({
		columns: { institutionId: true },
	});
	const alreadyHaveScale = new Set(existing.map((r) => r.institutionId));

	const toCreate = institutions.filter(
		(inst) => !alreadyHaveScale.has(inst.id),
	);

	if (!toCreate.length) {
		return;
	}

	for (const inst of toCreate) {
		await db.insert(schema.gradeScales).values({
			institutionId: inst.id,
			passThreshold: "10",
			compensationThreshold: "8",
			mentionRanges: DEFAULT_MENTION_RANGES,
		});
		console.log(
			`[backfill] Created default grade scale for institution ${inst.code} (${inst.id})`,
		);
	}

	console.log(
		`[backfill] Grade scales: created ${toCreate.length}, skipped ${alreadyHaveScale.size} already configured.`,
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
