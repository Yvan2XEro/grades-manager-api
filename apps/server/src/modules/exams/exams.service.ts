import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../db/schema/app-schema";
import { transaction } from "../_shared/db-transaction";
import { notFound } from "../_shared/errors";
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
) {
	let created: schema.Exam | undefined;
	const resolvedScheduler = await resolveDomainUserId(schedulerId);
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
				status: schedulerId ? "scheduled" : "draft",
				scheduledBy: resolvedScheduler,
				scheduledAt: schedulerId ? new Date() : null,
			})
			.returning();
	});
	return created;
}

export async function updateExam(id: string, data: Partial<schema.NewExam>) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	assertEditable(existing);
	if (data.percentage !== undefined) {
		await assertPercentageLimit(existing.classCourse, Number(data.percentage), {
			id,
			percentage: Number(existing.percentage),
		});
	}
	return repo.update(id, data);
}

export async function submitExam(examId: string, submitterId: string | null) {
	const existing = await repo.findById(examId);
	if (!existing) throw notFound();
	assertEditable(existing);
	const resolved = await resolveDomainUserId(submitterId);
	if (!["draft", "scheduled"].includes(existing.status)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Exam cannot be submitted in its current status",
		});
	}
	return repo.update(examId, {
		status: "submitted",
		scheduledBy: resolved ?? existing.scheduledBy,
		scheduledAt: new Date(),
	});
}

export async function validateExam(
	examId: string,
	approverId: string | null,
	status: "approved" | "rejected",
) {
	const existing = await repo.findById(examId);
	if (!existing) throw notFound();
	const resolved = await resolveDomainUserId(approverId);
	if (status === "approved" && existing.status !== "submitted") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Exam must be submitted before approval",
		});
	}
	return repo.update(examId, {
		status,
		validatedBy: resolved,
		validatedAt: new Date(),
	});
}

export async function deleteExam(id: string) {
	const existing = await repo.findById(id);
	if (!existing) throw notFound();
	assertEditable(existing);
	await repo.remove(id);
}

export async function listExams(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}

export async function getExamById(id: string) {
	const item = await repo.findById(id);
	if (!item) throw notFound();
	return item;
}

export async function setLock(examId: string, lock: boolean) {
	const existing = await repo.findById(examId);
	if (!existing) throw notFound();
	if (lock && existing.status !== "approved") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only approved exams can be locked",
		});
	}
	return repo.setLock(examId, lock);
}
