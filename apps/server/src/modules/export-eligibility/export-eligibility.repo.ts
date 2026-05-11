import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";

export type ExamWeightRow = {
	classCourseId: string;
	courseId: string;
	courseName: string;
	teachingUnitId: string;
	totalWeight: number;
	examCount: number;
};

/**
 * Returns aggregated exam weight per class_course for the given class + semester.
 * Only normal-session exams are counted (retakes don't add to total weight).
 */
export async function getClassCourseExamWeights(params: {
	classId: string;
	semesterId?: string;
	institutionId: string;
}): Promise<ExamWeightRow[]> {
	const conditions = [
		eq(schema.classCourses.class, params.classId),
		eq(schema.classCourses.institutionId, params.institutionId),
	];
	if (params.semesterId) {
		conditions.push(eq(schema.classCourses.semesterId, params.semesterId));
	}

	const rows = await db
		.select({
			classCourseId: schema.classCourses.id,
			courseId: schema.courses.id,
			courseName: schema.courses.name,
			teachingUnitId: schema.courses.teachingUnitId,
			totalWeight: sql<string>`COALESCE(SUM(CASE WHEN ${schema.exams.sessionType} = 'normal' THEN ${schema.exams.percentage} ELSE 0 END), 0)`,
			examCount: sql<number>`COUNT(${schema.exams.id})`,
		})
		.from(schema.classCourses)
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.leftJoin(
			schema.exams,
			eq(schema.exams.classCourse, schema.classCourses.id),
		)
		.where(and(...conditions))
		.groupBy(
			schema.classCourses.id,
			schema.courses.id,
			schema.courses.name,
			schema.courses.teachingUnitId,
		);

	return rows.map((r) => ({
		classCourseId: r.classCourseId,
		courseId: r.courseId,
		courseName: r.courseName,
		teachingUnitId: r.teachingUnitId,
		totalWeight: Number(r.totalWeight),
		examCount: Number(r.examCount),
	}));
}

/**
 * Returns the exams that exist for a single class_course (used for EC-level breakdown).
 */
export async function getExamsForClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	return db
		.select({
			id: schema.exams.id,
			name: schema.exams.name,
			type: schema.exams.type,
			percentage: schema.exams.percentage,
			sessionType: schema.exams.sessionType,
			status: schema.exams.status,
			isLocked: schema.exams.isLocked,
		})
		.from(schema.exams)
		.where(
			and(
				eq(schema.exams.classCourse, classCourseId),
				eq(schema.exams.institutionId, institutionId),
			),
		);
}

export async function getTeachingUnitsByIds(unitIds: string[]) {
	if (!unitIds.length) return [];
	return db
		.select({
			id: schema.teachingUnits.id,
			name: schema.teachingUnits.name,
			code: schema.teachingUnits.code,
		})
		.from(schema.teachingUnits)
		.where(inArray(schema.teachingUnits.id, unitIds));
}

export async function findClassCourseById(
	classCourseId: string,
	institutionId: string,
) {
	const [row] = await db
		.select({
			id: schema.classCourses.id,
			classId: schema.classCourses.class,
			courseId: schema.classCourses.course,
			semesterId: schema.classCourses.semesterId,
			teachingUnitId: schema.courses.teachingUnitId,
			courseName: schema.courses.name,
		})
		.from(schema.classCourses)
		.innerJoin(
			schema.courses,
			eq(schema.courses.id, schema.classCourses.course),
		)
		.where(
			and(
				eq(schema.classCourses.id, classCourseId),
				eq(schema.classCourses.institutionId, institutionId),
			),
		)
		.limit(1);
	return row ?? null;
}
