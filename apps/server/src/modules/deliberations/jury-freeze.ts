import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import type {
	DeliberationStatus,
	DeliberationType,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

/**
 * Once a jury is closed, its figures are the official ones (PV, transcript,
 * diploma). The marks it was computed from are frozen with it: changing one
 * means reopening the jury first (a signed jury can only be reopened by a
 * super admin, with a reason), so the change is audited and the jury is
 * recomputed instead of silently disagreeing with the marks.
 */

/** Stable error code; the web translates it. */
export const JURY_CLOSED_ERROR = "JURY_CLOSED";

const FROZEN: DeliberationStatus[] = ["closed", "signed"];

type ExamScope = {
	classCourse: string;
	sessionType: string | null;
};

/**
 * Whether a jury's computation reads the marks of an exam: a normal-session
 * mark feeds every jury of its class (a semester one only for that
 * semester's courses); a retake mark only feeds the retake jury.
 */
export function juryCoversExam(
	jury: { type: DeliberationType; semesterId: string | null },
	exam: { sessionType: string | null },
	courseSemesterId: string | null,
) {
	if (exam.sessionType === "retake") return jury.type === "retake";
	if (jury.type === "semester") {
		return !!courseSemesterId && jury.semesterId === courseSemesterId;
	}
	return true;
}

/** Closed or signed juries of the given classes. */
export async function listFrozenJuries(classIds: string[]) {
	if (classIds.length === 0) return [];
	return db
		.select({
			id: schema.deliberations.id,
			classId: schema.deliberations.classId,
			type: schema.deliberations.type,
			semesterId: schema.deliberations.semesterId,
			status: schema.deliberations.status,
		})
		.from(schema.deliberations)
		.where(
			and(
				inArray(schema.deliberations.classId, classIds),
				inArray(schema.deliberations.status, FROZEN),
			),
		);
}

/** Closed or signed juries computed from the marks of this exam. */
export async function findFreezingJuries(exam: ExamScope) {
	const classCourse = await db.query.classCourses.findFirst({
		where: eq(schema.classCourses.id, exam.classCourse),
		columns: { class: true, semesterId: true },
	});
	if (!classCourse) return [];
	const juries = await listFrozenJuries([classCourse.class]);
	return juries.filter((jury) =>
		juryCoversExam(jury, exam, classCourse.semesterId),
	);
}

/** Refuses a change to the marks of an exam a closed/signed jury relies on. */
export async function assertExamMarksNotFrozen(exam: ExamScope) {
	const [jury] = await findFreezingJuries(exam);
	if (jury) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: `${JURY_CLOSED_ERROR}:${jury.status}:${jury.id}`,
		});
	}
}

export type JuryStaleness = {
	/** Marks changed after the last computation of the jury. */
	isOutdated: boolean;
	lastComputedAt: Date | null;
	/** Marks written or removed since then. */
	changedMarks: number;
};

/**
 * Whether the marks a jury is computed from changed after its last
 * computation: its results no longer match the marks and must be recomputed
 * (the jury being reopened first when it is closed).
 */
export async function getJuryStaleness(delib: {
	id: string;
	classId: string;
	semesterId: string | null;
	type: DeliberationType;
}): Promise<JuryStaleness> {
	const [lastCompute] = await db
		.select({ at: schema.deliberationLogs.createdAt })
		.from(schema.deliberationLogs)
		.where(
			and(
				eq(schema.deliberationLogs.deliberationId, delib.id),
				eq(schema.deliberationLogs.action, "computed"),
			),
		)
		.orderBy(desc(schema.deliberationLogs.createdAt))
		.limit(1);
	if (!lastCompute) {
		return { isOutdated: false, lastComputedAt: null, changedMarks: 0 };
	}
	const since = lastCompute.at;

	const courseScope = [eq(schema.classCourses.class, delib.classId)];
	if (delib.semesterId) {
		courseScope.push(eq(schema.classCourses.semesterId, delib.semesterId));
	}
	// Juries other than the retake one ignore retake marks.
	const sessionScope =
		delib.type === "retake"
			? undefined
			: or(
					eq(schema.exams.sessionType, "normal"),
					isNull(schema.exams.sessionType),
				);

	const [written, removed] = await Promise.all([
		db
			.select({ id: schema.grades.id })
			.from(schema.grades)
			.innerJoin(schema.exams, eq(schema.exams.id, schema.grades.exam))
			.innerJoin(
				schema.classCourses,
				eq(schema.classCourses.id, schema.exams.classCourse),
			)
			.where(
				and(...courseScope, sessionScope, gt(schema.grades.updatedAt, since)),
			),
		db
			.select({ id: schema.gradeEditLogs.id })
			.from(schema.gradeEditLogs)
			.innerJoin(schema.exams, eq(schema.exams.id, schema.gradeEditLogs.examId))
			.innerJoin(
				schema.classCourses,
				eq(schema.classCourses.id, schema.exams.classCourse),
			)
			.where(
				and(
					...courseScope,
					sessionScope,
					eq(schema.gradeEditLogs.action, "delete"),
					gt(schema.gradeEditLogs.createdAt, since),
				),
			),
	]);
	const changedMarks = written.length + removed.length;
	return { isOutdated: changedMarks > 0, lastComputedAt: since, changedMarks };
}
