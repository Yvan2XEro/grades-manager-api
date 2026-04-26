#!/usr/bin/env bun
/**
 * Backfill student_course_enrollments for every class.
 *
 * For each class, calls autoEnrollClass(classId, academicYearId) which creates
 * one studentCourseEnrollment per (student × class_course) pair.
 *
 * Idempotent — existing enrollments are skipped (CONFLICT in createEnrollment).
 */
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import { autoEnrollClass } from "@/modules/student-course-enrollments/student-course-enrollments.service";

async function run() {
	const classes = await db
		.select({
			id: schema.classes.id,
			name: schema.classes.name,
			academicYearId: schema.classes.academicYear,
		})
		.from(schema.classes);

	if (!classes.length) {
		console.log("No classes found.");
		return;
	}

	console.log(`Backfilling enrollments for ${classes.length} classes…\n`);

	let totalCreated = 0;
	let totalSkipped = 0;

	for (const klass of classes) {
		try {
			const result = await autoEnrollClass({
				classId: klass.id,
				academicYearId: klass.academicYearId,
				status: "active",
			});
			totalCreated += result.createdCount;
			totalSkipped += result.skippedCount;
			console.log(
				`  [OK] ${klass.name}: ${result.studentsCount} students × ${result.classCoursesCount} courses → created=${result.createdCount}, skipped=${result.skippedCount}`,
			);
		} catch (err: any) {
			console.log(`  [ERR] ${klass.name}: ${err?.message ?? err}`);
		}
	}

	console.log(
		`\nDONE. Created=${totalCreated}, Skipped=${totalSkipped} (already existed).`,
	);
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
