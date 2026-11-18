import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as deliberations from "@/modules/deliberations/deliberations.service";
import { recomputeForStudent } from "@/modules/student-credit-ledger/student-credit-ledger.service";
import { isPastYear, requireYear } from "./steps/year-context";

export interface ClosingReport {
	lockedExams: number;
	students: number;
	deliberations: { created: number; recomputed: number; skipped: number };
}

/**
 * End of the import of a year: credits recomputed for every student of the
 * year, and one annual deliberation per class computed from the imported
 * grades and left open for review. For a past year, its exams are also
 * approved and locked. Can be run again after a correction: open
 * deliberations are recomputed, closed ones are left untouched.
 */
export async function closeImportedYear(opts: {
	institutionId: string;
	academicYearId: string;
	actorId: string;
}): Promise<ClosingReport> {
	const year = await requireYear(opts);
	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, year.id),
			eq(schema.classes.institutionId, opts.institutionId),
		),
	});
	const classIds = classes.map((c) => c.id);
	const report: ClosingReport = {
		lockedExams: 0,
		students: 0,
		deliberations: { created: 0, recomputed: 0, skipped: 0 },
	};
	if (!classIds.length) return report;

	if (isPastYear(year)) {
		const classCourses = await db.query.classCourses.findMany({
			where: inArray(schema.classCourses.class, classIds),
			columns: { id: true },
		});
		if (classCourses.length) {
			const locked = await db
				.update(schema.exams)
				.set({ status: "approved", isLocked: true })
				.where(
					and(
						inArray(
							schema.exams.classCourse,
							classCourses.map((cc) => cc.id),
						),
						eq(schema.exams.isLocked, false),
					),
				)
				.returning({ id: schema.exams.id });
			report.lockedExams = locked.length;
		}
	}

	const enrolled = await db
		.selectDistinct({ studentId: schema.enrollments.studentId })
		.from(schema.enrollments)
		.where(
			and(
				eq(schema.enrollments.academicYearId, year.id),
				inArray(schema.enrollments.classId, classIds),
				ne(schema.enrollments.status, "withdrawn"),
			),
		);
	for (const { studentId } of enrolled)
		await recomputeForStudent(studentId, year.id);
	report.students = enrolled.length;

	const existing = await db.query.deliberations.findMany({
		where: and(
			eq(schema.deliberations.academicYearId, year.id),
			eq(schema.deliberations.type, "annual"),
			inArray(schema.deliberations.classId, classIds),
		),
	});
	for (const klass of classes) {
		const delib = existing.find((d) => d.classId === klass.id);
		if (!delib) {
			await deliberations.initAndCompute(
				{
					classId: klass.id,
					academicYearId: year.id,
					type: "annual",
					juryMembers: [],
				},
				opts.institutionId,
				opts.actorId,
			);
			report.deliberations.created++;
		} else if (delib.status === "open") {
			await deliberations.compute(delib.id, opts.institutionId, opts.actorId);
			report.deliberations.recomputed++;
		} else report.deliberations.skipped++;
	}
	return report;
}
