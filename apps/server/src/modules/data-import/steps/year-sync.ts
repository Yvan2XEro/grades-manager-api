import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

const UNASSIGNED_TEACHER_EMAIL = (institutionId: string) =>
	`unassigned-teacher@${institutionId}.invalid`;

/**
 * Profile standing for "teacher not known yet": a class course needs a
 * teacher, and history files often have none. Created once per institution,
 * without an account; replaced by the real teacher whenever it is given.
 */
export async function unassignedTeacher(institutionId: string) {
	const email = UNASSIGNED_TEACHER_EMAIL(institutionId);
	const existing = await db.query.domainUsers.findFirst({
		where: and(
			eq(schema.domainUsers.institutionId, institutionId),
			eq(schema.domainUsers.primaryEmail, email),
		),
	});
	if (existing) return existing.id;
	const [created] = await db
		.insert(schema.domainUsers)
		.values({
			firstName: "—",
			lastName: "Unassigned teacher",
			primaryEmail: email,
			institutionId,
		})
		.returning({ id: schema.domainUsers.id });
	return created.id;
}

/**
 * Enrolls every student enrolled in a class that year in every course of the
 * class (missing pairs only, in bulk). Exceptions (exemptions) stay possible
 * by withdrawing a course enrollment afterwards.
 */
export async function syncCourseEnrollments(
	academicYearId: string,
	classIds: string[],
) {
	if (!classIds.length) return 0;
	const [enrollments, classCourses] = await Promise.all([
		db.query.enrollments.findMany({
			where: and(
				eq(schema.enrollments.academicYearId, academicYearId),
				inArray(schema.enrollments.classId, classIds),
				ne(schema.enrollments.status, "withdrawn"),
			),
			columns: { studentId: true, classId: true },
		}),
		db
			.select({
				id: schema.classCourses.id,
				classId: schema.classCourses.class,
				courseId: schema.classCourses.course,
				credits: schema.teachingUnits.credits,
			})
			.from(schema.classCourses)
			.innerJoin(
				schema.courses,
				eq(schema.courses.id, schema.classCourses.course),
			)
			.innerJoin(
				schema.teachingUnits,
				eq(schema.teachingUnits.id, schema.courses.teachingUnitId),
			)
			.where(inArray(schema.classCourses.class, classIds)),
	]);
	const coursesOf = new Map<string, typeof classCourses>();
	for (const cc of classCourses)
		coursesOf.set(cc.classId, [...(coursesOf.get(cc.classId) ?? []), cc]);
	const rows: schema.NewStudentCourseEnrollment[] = enrollments.flatMap((e) =>
		(coursesOf.get(e.classId) ?? []).map((cc) => ({
			studentId: e.studentId,
			classCourseId: cc.id,
			courseId: cc.courseId,
			sourceClassId: e.classId,
			academicYearId,
			status: "active" as const,
			attempt: 1,
			creditsAttempted: cc.credits,
		})),
	);
	let created = 0;
	for (let i = 0; i < rows.length; i += 500) {
		const inserted = await db
			.insert(schema.studentCourseEnrollments)
			.values(rows.slice(i, i + 500))
			.onConflictDoNothing()
			.returning({ id: schema.studentCourseEnrollments.id });
		created += inserted.length;
	}
	return created;
}
