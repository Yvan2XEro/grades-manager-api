import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import type { MemberRole } from "../authz";
import { ADMIN_ROLES, roleSatisfies } from "../authz";
import * as examGradeEditorsRepo from "../exam-grade-editors/exam-grade-editors.repo";
import * as courseEnrollments from "../student-course-enrollments/student-course-enrollments.service";
import * as courseEnrollmentRepo from "../student-course-enrollments/student-course-enrollments.repo";
import * as gradesRepo from "../grades/grades.repo";
import * as retakeOverridesRepo from "./retake-overrides.repo";
import * as repo from "./exams.repo";

type CreateExamInput = {
	name: string;
	type: string;
	date: Date;
	percentage: string;
	classCourse: string;
};

function assertEditable(exam: schema.Exam) {
	if (exam.isLocked || exam.status === "approved") {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
}

async function requireClassCourse(
	classCourseId: string,
	institutionId: string,
) {
	const classCourse = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
	});
	if (!classCourse) throw notFound("Class course not found");
	return classCourse;
}

async function getTeacherMap(classCourseIds: string[]) {
	if (classCourseIds.length === 0) return new Map<string, string | null>();
	const rows = await db
		.select({
			id: schema.classCourses.id,
			teacher: schema.classCourses.teacher,
		})
		.from(schema.classCourses)
		.where(inArray(schema.classCourses.id, classCourseIds));
	return new Map(rows.map((row) => [row.id, row.teacher]));
}

async function requireExam(id: string, institutionId: string) {
	const exam = await repo.findById(id);
	if (!exam || exam.institutionId !== institutionId) throw notFound();
	return exam;
}

async function assertPercentageLimit(
	classCourseId: string,
	newPercentage: number,
	excludeExam?: { id: string; percentage: number },
) {
	const [{ total }] = await db
		.select({
			total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)`,
		})
		.from(schema.exams)
		.where(eq(schema.exams.classCourse, classCourseId));
	let aggregated = Number(total);
	if (excludeExam) {
		aggregated -= Number(excludeExam.percentage);
	}
	if (aggregated + newPercentage > 100) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Percentage exceeds 100",
		});
	}
}

async function resolveDomainUserId(userId: string | null | undefined) {
	if (!userId) return null;
	const exists = await db.query.domainUsers.findFirst({
		where: eq(schema.domainUsers.id, userId),
	});
	return exists ? userId : null;
}

export async function createExam(
	data: CreateExamInput,
	schedulerId: string | null,
	institutionId: string,
) {
	let created: schema.Exam | undefined;
	const resolvedScheduler = await resolveDomainUserId(schedulerId);
	const classCourse = await requireClassCourse(data.classCourse, institutionId);
	const tenantId = classCourse.institutionId ?? institutionId;
	await courseEnrollments.ensureRosterForClassCourse(data.classCourse);
	await transaction(async (tx) => {
		const [{ total }] = await tx
			.select({
				total: sql<number>`coalesce(sum(${schema.exams.percentage}),0)`,
			})
			.from(schema.exams)
			.where(eq(schema.exams.classCourse, data.classCourse));
		if (Number(total) + Number(data.percentage) > 100) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Percentage exceeds 100",
			});
		}
		[created] = await tx
			.insert(schema.exams)
			.values({
				...data,
				institutionId: tenantId,
				status: schedulerId ? "scheduled" : "draft",
				scheduledBy: resolvedScheduler,
				scheduledAt: schedulerId ? new Date() : null,
			})
			.returning();
	});
	return created;
}

export async function updateExam(
	id: string,
	data: Partial<schema.NewExam>,
	institutionId: string,
) {
	const existing = await requireExam(id, institutionId);
	assertEditable(existing);
	const payload = { ...data };
	if (data.classCourse && data.classCourse !== existing.classCourse) {
		await requireClassCourse(data.classCourse, institutionId);
		await courseEnrollments.ensureRosterForClassCourse(data.classCourse);
		payload.institutionId = institutionId;
	}
	if (data.percentage !== undefined) {
		await assertPercentageLimit(existing.classCourse, Number(data.percentage), {
			id,
			percentage: Number(existing.percentage),
		});
	}
	return repo.update(id, payload, institutionId);
}

export async function submitExam(
	examId: string,
	submitterId: string | null,
	institutionId: string,
) {
	const existing = await requireExam(examId, institutionId);
	assertEditable(existing);
	const resolved = await resolveDomainUserId(submitterId);
	if (!["draft", "scheduled"].includes(existing.status)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Exam cannot be submitted in its current status",
		});
	}
	return repo.update(
		examId,
		{
			status: "submitted",
			scheduledBy: resolved ?? existing.scheduledBy,
			scheduledAt: new Date(),
		},
		institutionId,
	);
}

export async function validateExam(
	examId: string,
	approverId: string | null,
	status: "approved" | "rejected",
	institutionId: string,
) {
	const existing = await requireExam(examId, institutionId);
	const resolved = await resolveDomainUserId(approverId);
	if (status === "approved" && existing.status !== "submitted") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Exam must be submitted before approval",
		});
	}
	return repo.update(
		examId,
		{
			status,
			validatedBy: resolved,
			validatedAt: new Date(),
		},
		institutionId,
	);
}

export async function deleteExam(id: string, institutionId: string) {
	const existing = await requireExam(id, institutionId);
	assertEditable(existing);
	await repo.remove(id, institutionId);
}

export async function listExams(
	opts: Parameters<typeof repo.list>[0],
	params: {
		institutionId: string;
		profileId: string | null;
		memberRole: MemberRole | null;
	},
) {
	const result = await repo.list({ ...opts, institutionId: params.institutionId });
	const exams = result.items;
	const classCourseIds = Array.from(new Set(exams.map((exam) => exam.classCourse)));
	const teacherMap = await getTeacherMap(classCourseIds);
	const examIds = exams.map((exam) => exam.id);
	const delegateSet =
		params.profileId && examIds.length > 0
			? new Set(
					await examGradeEditorsRepo.examIdsForEditor(
						params.profileId,
						examIds,
					),
				)
			: new Set<string>();
	const isAdmin = roleSatisfies(params.memberRole, ADMIN_ROLES);
	const enriched = exams.map((exam) => {
		const isTeacher =
			params.profileId !== null &&
			teacherMap.get(exam.classCourse) === params.profileId;
		const canEdit =
			isAdmin ||
			isTeacher ||
			(params.profileId ? delegateSet.has(exam.id) : false);
		return { ...exam, canEdit };
	});
	return {
		...result,
		items: isAdmin ? enriched : enriched.filter((exam) => exam.canEdit),
	};
}

export async function getExamById(id: string, institutionId: string) {
	return requireExam(id, institutionId);
}

export async function setLock(
	examId: string,
	lock: boolean,
	institutionId: string,
) {
	const existing = await requireExam(examId, institutionId);
	if (lock && existing.status !== "approved") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only approved exams can be locked",
		});
	}
	return repo.setLock(examId, lock, institutionId);
}

const PASSING_GRADE = 10;

export type RetakeEligibilityReason =
	| "FAILED_EXAM"
	| "NO_GRADE"
	| "PASSED_EXAM"
	| "ATTEMPT_LIMIT_REACHED"
	| "OVERRIDE_FORCE_ELIGIBLE"
	| "OVERRIDE_FORCE_INELIGIBLE";

export type RetakeEligibilityRow = {
	examId: string;
	classCourseId: string;
	studentCourseEnrollmentId: string;
	studentId: string;
	registrationNumber: string;
	studentName: string;
	attempt: number;
	grade: number | null;
	status: "eligible" | "ineligible";
	reasons: RetakeEligibilityReason[];
	override?: {
		id: string;
		decision: schema.RetakeOverrideDecision;
		reason: string;
		createdAt: Date;
		createdBy: string | null;
	};
};

function parseScore(score: string | null | undefined) {
	if (score === null || score === undefined) return null;
	const value = Number(score);
	return Number.isNaN(value) ? null : value;
}

function buildEligibilityResult(input: {
	enrollment: schema.StudentCourseEnrollment;
	gradeValue: number | null;
	maxAttempt: number;
	override?: retakeOverridesRepo.RetakeOverride;
}): { status: "eligible" | "ineligible"; reasons: RetakeEligibilityReason[] } {
	const reasons = new Set<RetakeEligibilityReason>();
	let eligible =
		input.enrollment.status === "failed" ||
		input.gradeValue === null ||
		input.gradeValue < PASSING_GRADE;
	if (input.gradeValue === null) {
		reasons.add("NO_GRADE");
	} else if (
		input.enrollment.status === "failed" ||
		input.gradeValue < PASSING_GRADE
	) {
		reasons.add("FAILED_EXAM");
	} else {
		reasons.add("PASSED_EXAM");
	}
	if (eligible && input.maxAttempt > input.enrollment.attempt) {
		eligible = false;
		reasons.add("ATTEMPT_LIMIT_REACHED");
	}
	if (input.override) {
		const overrideReason =
			input.override.decision === "force_eligible"
				? "OVERRIDE_FORCE_ELIGIBLE"
				: "OVERRIDE_FORCE_INELIGIBLE";
		reasons.add(overrideReason);
		eligible = input.override.decision === "force_eligible";
	}
	return { status: eligible ? "eligible" : "ineligible", reasons: [...reasons] };
}

export async function listRetakeEligibility(
	examId: string,
	institutionId: string,
): Promise<RetakeEligibilityRow[]> {
	const exam = await requireExam(examId, institutionId);
	if (exam.status !== "approved") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Exam must be approved before computing retake eligibility",
		});
	}
	const classCourse = await requireClassCourse(exam.classCourse, institutionId);
	const klass = await db.query.classes.findFirst({
		where: eq(schema.classes.id, classCourse.class),
	});
	if (!klass) throw notFound("Class context not found");
	const roster = await courseEnrollmentRepo.listForClassCourseWithStudentProfile(
		classCourse.id,
		institutionId,
	);
	if (roster.length === 0) return [];
	const gradeMap = await gradesRepo.mapByExam(examId);
	const studentIds = roster.map((entry) => entry.studentId);
	const attemptMap = await courseEnrollmentRepo.maxAttemptsForCourseYear(
		classCourse.course,
		klass.academicYear,
		studentIds,
	);
	const overrides = await retakeOverridesRepo.listByExam(examId, institutionId);
	const overridesByEnrollment = new Map(
		overrides.map((record) => [record.studentCourseEnrollmentId, record]),
	);
	return roster.map((entry) => {
		const grade = gradeMap.get(entry.studentId);
		const gradeValue = grade ? parseScore(grade.score) : null;
		const maxAttempt =
			attemptMap.get(entry.studentId) ?? entry.enrollment.attempt;
		const override = overridesByEnrollment.get(entry.enrollment.id);
		const evaluation = buildEligibilityResult({
			enrollment: entry.enrollment,
			gradeValue,
			maxAttempt,
			override,
		});
		return {
			examId: exam.id,
			classCourseId: classCourse.id,
			studentCourseEnrollmentId: entry.enrollment.id,
			studentId: entry.studentId,
			registrationNumber: entry.registrationNumber,
			studentName: `${entry.lastName} ${entry.firstName}`,
			attempt: entry.enrollment.attempt,
			grade: gradeValue,
			status: evaluation.status,
			reasons: evaluation.reasons,
			override: override
				? {
						id: override.id,
						decision: override.decision,
						reason: override.reason,
						createdAt: override.createdAt,
						createdBy: override.createdBy,
					}
				: undefined,
		};
	});
}

export async function upsertRetakeOverride(
	examId: string,
	studentCourseEnrollmentId: string,
	payload: {
		decision: schema.RetakeOverrideDecision;
		reason: string;
	},
	institutionId: string,
	actorId: string | null,
) {
	const exam = await requireExam(examId, institutionId);
	const enrollment = await courseEnrollmentRepo.findById(
		studentCourseEnrollmentId,
		institutionId,
	);
	if (!enrollment) throw notFound("Enrollment not found");
	if (enrollment.classCourseId !== exam.classCourse) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Enrollment does not belong to the exam's class course",
		});
	}
	const resolvedActor = await resolveDomainUserId(actorId);
	return retakeOverridesRepo.upsert({
		examId,
		studentCourseEnrollmentId,
		institutionId,
		decision: payload.decision,
		reason: payload.reason,
		createdBy: resolvedActor,
	});
}

export async function deleteRetakeOverride(
	examId: string,
	studentCourseEnrollmentId: string,
	institutionId: string,
) {
	const exam = await requireExam(examId, institutionId);
	const enrollment = await courseEnrollmentRepo.findById(
		studentCourseEnrollmentId,
		institutionId,
	);
	if (!enrollment) throw notFound("Enrollment not found");
	if (enrollment.classCourseId !== exam.classCourse) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Enrollment does not belong to the exam's class course",
		});
	}
	await retakeOverridesRepo.deleteByExamAndEnrollment(
		examId,
		studentCourseEnrollmentId,
		institutionId,
	);
	return true;
}

export function assignScheduleRun(
	examIds: string[],
	runId: string,
	institutionId: string,
) {
	return repo.assignScheduleRun(examIds, runId, institutionId);
}
