#!/usr/bin/env bun
import { sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const totals = await db
	.select({
		studentCourseEnrollments: sql<number>`(SELECT count(*)::int FROM ${schema.studentCourseEnrollments})`,
		students: sql<number>`(SELECT count(*)::int FROM ${schema.students})`,
		classCourses: sql<number>`(SELECT count(*)::int FROM ${schema.classCourses})`,
		enrollments: sql<number>`(SELECT count(*)::int FROM ${schema.enrollments})`,
	})
	.from(schema.classCourses)
	.limit(1);

console.log(JSON.stringify(totals[0] ?? {}, null, 2));

// And per class
const perClass = await db
	.select({
		classId: schema.students.class,
		studentCount: sql<number>`count(*)::int`,
	})
	.from(schema.students)
	.groupBy(schema.students.class);
console.log("\nÉtudiants par classe :");
for (const r of perClass) console.log(`  ${r.classId}: ${r.studentCount}`);

process.exit(0);
