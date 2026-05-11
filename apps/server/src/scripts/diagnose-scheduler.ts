#!/usr/bin/env bun
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

async function run() {
	console.log("\n=== DIAGNOSTIC EXAM SCHEDULER ===\n");

	// 1) Institutions
	const institutions = await db
		.select({ id: schema.institutions.id, name: schema.institutions.nameFr })
		.from(schema.institutions);
	console.log(`[1] Institutions: ${institutions.length}`);
	for (const inst of institutions) {
		console.log(`     - ${inst.name} (${inst.id})`);
	}

	// 2) Academic years
	const years = await db
		.select({
			id: schema.academicYears.id,
			name: schema.academicYears.name,
			institutionId: schema.academicYears.institutionId,
			isActive: schema.academicYears.isActive,
		})
		.from(schema.academicYears);
	console.log(`\n[2] Années académiques: ${years.length}`);
	for (const y of years) {
		console.log(
			`     - ${y.name} (active=${y.isActive}) inst=${y.institutionId}`,
		);
	}

	// 3) Semesters (global, pas d'institutionId)
	const semesters = await db
		.select({
			id: schema.semesters.id,
			name: schema.semesters.name,
			code: schema.semesters.code,
		})
		.from(schema.semesters);
	console.log(`\n[3] Semestres (globaux): ${semesters.length}`);
	for (const s of semesters) {
		console.log(`     - ${s.name} [${s.code}] (${s.id})`);
	}

	// 4) Classes per academic year
	const classes = await db
		.select({
			id: schema.classes.id,
			name: schema.classes.name,
			academicYear: schema.classes.academicYear,
			semesterId: schema.classes.semesterId,
			institutionId: schema.classes.institutionId,
			programId: schema.classes.program,
		})
		.from(schema.classes);
	console.log(`\n[4] Classes: ${classes.length}`);
	for (const c of classes) {
		console.log(
			`     - ${c.name} | year=${c.academicYear} | classSemester=${c.semesterId ?? "NULL"}`,
		);
	}

	// 5) class_courses semester distribution — THE KEY METRIC
	const ccTotal = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.classCourses);
	const ccNull = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.classCourses)
		.where(isNull(schema.classCourses.semesterId));
	const ccBySemester = await db
		.select({
			semesterId: schema.classCourses.semesterId,
			count: sql<number>`count(*)::int`,
		})
		.from(schema.classCourses)
		.groupBy(schema.classCourses.semesterId);

	console.log("\n[5] class_courses (LE PROBLEME EST ICI):");
	console.log(`     - total: ${ccTotal[0]?.count ?? 0}`);
	console.log(`     - avec semester_id NULL: ${ccNull[0]?.count ?? 0}`);
	console.log("     - répartition par semestre:");
	for (const row of ccBySemester) {
		const sem = semesters.find((s) => s.id === row.semesterId);
		const label = row.semesterId
			? `${sem?.name ?? "?"} (${row.semesterId})`
			: "NULL (orphelins)";
		console.log(`         · ${label}: ${row.count}`);
	}

	// 6) Per-class, per-semester drill-down
	console.log(
		"\n[6] Détail par classe (count class_courses par semestre choisi):",
	);
	for (const c of classes) {
		const counts = await db
			.select({
				semesterId: schema.classCourses.semesterId,
				count: sql<number>`count(*)::int`,
			})
			.from(schema.classCourses)
			.where(eq(schema.classCourses.class, c.id))
			.groupBy(schema.classCourses.semesterId);
		const summary =
			counts
				.map((row) => {
					const sem = semesters.find((s) => s.id === row.semesterId);
					return `${sem?.name ?? row.semesterId ?? "NULL"}=${row.count}`;
				})
				.join(", ") || "AUCUN class_course";
		console.log(`     - ${c.name}: ${summary}`);
	}

	// 7) Simulate scheduler query for the active year and each semester
	const activeYear = years.find((y) => y.isActive) ?? years[0];
	if (activeYear) {
		console.log(
			`\n[7] Simulation requête scheduler — année=${activeYear.name}:`,
		);
		for (const sem of semesters) {
			const visible = await db
				.select({ id: schema.classes.id, name: schema.classes.name })
				.from(schema.classes)
				.innerJoin(
					schema.classCourses,
					and(
						eq(schema.classCourses.class, schema.classes.id),
						eq(schema.classCourses.semesterId, sem.id),
					),
				)
				.where(eq(schema.classes.academicYear, activeYear.id))
				.groupBy(schema.classes.id, schema.classes.name);
			console.log(
				`     - Semestre "${sem.name}": ${visible.length} classe(s) visible(s) ${visible.length === 0 ? "❌" : "✅"}`,
			);
			for (const v of visible) console.log(`         · ${v.name}`);
		}
	}

	console.log("\n=== FIN DIAGNOSTIC ===\n");
}

run()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Diagnostic failed:", err);
		process.exit(1);
	});
