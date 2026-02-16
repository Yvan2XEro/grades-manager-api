import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type {
	BatchJobStatus,
	BatchJobStepStatus,
	NewBatchJob,
	NewBatchJobLog,
	NewBatchJobStep,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

// ── Jobs ───────────────────────────────────────────────────────────────

export async function createJob(data: NewBatchJob) {
	const [job] = await db.insert(schema.batchJobs).values(data).returning();
	return job;
}

export async function findJobById(id: string) {
	return db.query.batchJobs.findFirst({
		where: eq(schema.batchJobs.id, id),
		with: { steps: true },
	});
}

export async function findJobWithLogs(id: string) {
	return db.query.batchJobs.findFirst({
		where: eq(schema.batchJobs.id, id),
		with: {
			steps: { with: { logs: true } },
			logs: true,
			createdByRef: true,
		},
	});
}

export async function updateJob(id: string, data: Partial<schema.BatchJob>) {
	const [updated] = await db
		.update(schema.batchJobs)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(schema.batchJobs.id, id))
		.returning();
	return updated;
}

export async function listJobs(
	institutionId: string,
	opts: {
		status?: BatchJobStatus[];
		type?: string;
		limit?: number;
		offset?: number;
	} = {},
) {
	const conditions = [eq(schema.batchJobs.institutionId, institutionId)];

	if (opts.status?.length) {
		conditions.push(inArray(schema.batchJobs.status, opts.status));
	}
	if (opts.type) {
		conditions.push(eq(schema.batchJobs.type, opts.type));
	}

	const items = await db.query.batchJobs.findMany({
		where: and(...conditions),
		orderBy: desc(schema.batchJobs.createdAt),
		limit: opts.limit ?? 50,
		offset: opts.offset ?? 0,
		with: { createdByRef: true },
	});

	const [countRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.batchJobs)
		.where(and(...conditions));

	return { items, total: countRow?.count ?? 0 };
}

/**
 * Check if an active job of the same type already exists for the institution.
 * Used to enforce scope locking.
 */
export async function findActiveJob(institutionId: string, type: string) {
	const activeStatuses: BatchJobStatus[] = ["pending", "previewed", "running"];
	return db.query.batchJobs.findFirst({
		where: and(
			eq(schema.batchJobs.institutionId, institutionId),
			eq(schema.batchJobs.type, type),
			inArray(schema.batchJobs.status, activeStatuses),
		),
	});
}

// ── Steps ──────────────────────────────────────────────────────────────

export async function createSteps(steps: NewBatchJobStep[]) {
	if (steps.length === 0) return [];
	return db.insert(schema.batchJobSteps).values(steps).returning();
}

export async function updateStep(
	id: string,
	data: Partial<schema.BatchJobStep>,
) {
	const [updated] = await db
		.update(schema.batchJobSteps)
		.set(data)
		.where(eq(schema.batchJobSteps.id, id))
		.returning();
	return updated;
}

export async function updateStepStatus(id: string, status: BatchJobStepStatus) {
	const now = new Date();
	const extra: Partial<schema.BatchJobStep> = { status };
	if (status === "running") extra.startedAt = now;
	if (status === "completed" || status === "failed") extra.completedAt = now;
	return updateStep(id, extra);
}

export async function getStepsForJob(jobId: string) {
	return db.query.batchJobSteps.findMany({
		where: eq(schema.batchJobSteps.jobId, jobId),
		orderBy: schema.batchJobSteps.stepIndex,
	});
}

// ── Logs ───────────────────────────────────────────────────────────────

export async function insertLog(data: NewBatchJobLog) {
	const [log] = await db.insert(schema.batchJobLogs).values(data).returning();
	return log;
}

export async function getLogsForJob(jobId: string, limit = 200) {
	return db.query.batchJobLogs.findMany({
		where: eq(schema.batchJobLogs.jobId, jobId),
		orderBy: desc(schema.batchJobLogs.timestamp),
		limit,
	});
}

// ── Heartbeat / Stale Detection ────────────────────────────────────────

export async function updateHeartbeat(jobId: string) {
	return updateJob(jobId, { lastHeartbeat: new Date() });
}

export async function findStaleJobs(thresholdMinutes = 10) {
	const threshold = new Date(Date.now() - thresholdMinutes * 60_000);
	return db.query.batchJobs.findMany({
		where: and(
			eq(schema.batchJobs.status, "running" as BatchJobStatus),
			sql`${schema.batchJobs.lastHeartbeat} < ${threshold}`,
		),
	});
}
