import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
import * as courseEnrollments from "../student-course-enrollments/student-course-enrollments.service";
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
	institutionId: string,
) {
	return repo.list({ ...opts, institutionId });
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

export function assignScheduleRun(
	examIds: string[],
	runId: string,
	institutionId: string,
) {
	return repo.assignScheduleRun(examIds, runId, institutionId);
}
