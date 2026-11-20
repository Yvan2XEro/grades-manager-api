import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { Context } from "@/lib/context";
import {
	createClassCourse,
	createCourse,
	createDomainUser,
	createTeachingUnit,
	makeTestContext,
} from "@/lib/test-utils";
import { appRouter } from "@/routers";

/** Helpers shared by the multi-year journey tests. */

export const caller = (ctx: Context) => appRouter.createCaller(ctx);

export async function adminContext() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

let examSeq = 0;
/** One CC (40%) and one final exam (60%) for a class course; scores per student. */
export async function gradeCourse(
	classCourseId: string,
	institutionId: string,
	scores: Array<{ studentId: string; cc: number; ex: number }>,
) {
	const exams = await db
		.insert(schema.exams)
		.values(
			(["CC", "EXAMEN"] as const).map((type) => ({
				name: `${type}-${++examSeq}`,
				type,
				date: new Date(),
				percentage: type === "CC" ? "40" : "60",
				classCourse: classCourseId,
				status: "approved" as const,
				isLocked: false,
				scheduledAt: new Date(),
				validatedAt: new Date(),
				institutionId,
			})),
		)
		.returning();
	const [cc, ex] = exams;
	if (scores.length === 0) return;
	await db.insert(schema.grades).values(
		scores.flatMap((s) => [
			{ student: s.studentId, exam: cc.id, score: s.cc.toString() },
			{ student: s.studentId, exam: ex.id, score: s.ex.toString() },
		]),
	);
}

/** Two UEs (6 + 4 credits), one course each, attached to a class. */
export async function curriculum(
	programId: string,
	classId: string,
	credits: number[] = [6, 4],
) {
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classId),
	});
	const ues = [];
	for (const ueCredits of credits) {
		const ue = await createTeachingUnit({ programId, credits: ueCredits });
		const course = await createCourse({
			program: programId,
			teachingUnitId: ue.id,
		});
		ues.push(
			await createClassCourse({
				class: classId,
				course: course.id,
				coefficient: "1",
				semesterId: klass!.semesterId!,
			}),
		);
	}
	return ues;
}

export async function enrollmentsOf(studentId: string) {
	return db.query.enrollments.findMany({
		where: eq(schema.enrollments.studentId, studentId),
	});
}
