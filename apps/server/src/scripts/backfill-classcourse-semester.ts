#!/usr/bin/env bun
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

async function run() {
	const orphans = await db
		.select({
			id: schema.classCourses.id,
			classId: schema.classCourses.class,
		})
		.from(schema.classCourses)
		.where(isNull(schema.classCourses.semesterId));

	if (!orphans.length) {
		console.log(
			"No class_courses with NULL semester_id — nothing to backfill.",
		);
		return;
	}

	const classIds = Array.from(new Set(orphans.map((row) => row.classId)));
	const classRows = await db
		.select({
			id: schema.classes.id,
			semesterId: schema.classes.semesterId,
		})
		.from(schema.classes);
	const classSemester = new Map(
		classRows.map((row) => [row.id, row.semesterId]),
	);

	let updated = 0;
	let skipped = 0;
	for (const orphan of orphans) {
		const semesterId = classSemester.get(orphan.classId);
		if (!semesterId) {
			skipped += 1;
			continue;
		}
		await db
			.update(schema.classCourses)
			.set({ semesterId })
			.where(eq(schema.classCourses.id, orphan.id));
		updated += 1;
	}

	console.log(
		`Backfill complete — updated ${updated}, skipped ${skipped} (class had no semester), scanned ${orphans.length} across ${classIds.length} classes.`,
	);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Backfill failed:", err);
		process.exit(1);
	});
