import { TRPCError } from "@trpc/server";
import type {
	BatchJobStatus,
	BatchJobStepStatus,
} from "@/db/schema/app-schema";
import { getJobDefinition } from "./batch-jobs.registry";
import * as repo from "./batch-jobs.repo";
import type {
	BatchJobType,
	JobContext,
	PreviewResult,
} from "./batch-jobs.types";

// ── Preview ────────────────────────────────────────────────────────────

export async function previewJob(
	type: BatchJobType,
	params: Record<string, unknown>,
	institutionId: string,
	createdBy: string | null,
) {
	const definition = getJobDefinition(type);
	if (!definition) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Unknown batch job type: ${type}`,
		});
	}

	// Scope lock: reject if another active job of the same type exists
	const existing = await repo.findActiveJob(institutionId, type);
	if (existing) {
		throw new TRPCError({
			code: "CONFLICT",
			message: `A ${definition.label} job is already active (id: ${existing.id}, status: ${existing.status})`,
		});
	}

	const parsed = definition.parseParams(params);

	// Create the job record
	const job = await repo.createJob({
		institutionId,
		type,
		params: params,
		status: "pending",
		createdBy,
	});

	// Build context for preview
	const ctx = buildJobContext(job.id, institutionId);

	await ctx.log("info", `Starting preview for ${definition.label}`);

	let previewResult: PreviewResult;
	try {
		previewResult = await definition.preview(parsed, ctx);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		await repo.updateJob(job.id, {
			status: "failed" as BatchJobStatus,
			error: `Preview failed: ${msg}`,
			failedAt: new Date(),
		});
		await ctx.log("error", `Preview failed: ${msg}`);
		throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
	}

	// Persist step definitions from preview
	const stepRecords = await repo.createSteps(
		previewResult.steps.map((s, i) => ({
			jobId: job.id,
			stepIndex: i,
			name: s.name,
			status: "pending" as BatchJobStepStatus,
			itemsTotal: s.estimatedItems ?? 0,
		})),
	);

	// Update job with preview result
	const updated = await repo.updateJob(job.id, {
		status: "previewed" as BatchJobStatus,
		previewResult: {
			...previewResult.summary,
			totalItems: previewResult.totalItems,
		},
		previewedAt: new Date(),
		progress: {
			currentStep: 0,
			totalSteps: stepRecords.length,
			itemsProcessed: 0,
			itemsTotal: previewResult.totalItems,
		},
	});

	await ctx.log(
		"info",
		`Preview complete: ${stepRecords.length} steps, ${previewResult.totalItems} items`,
	);

	return { ...updated, steps: stepRecords };
}

// ── Execute ────────────────────────────────────────────────────────────

export async function runJob(jobId: string, institutionId: string) {
	const job = await repo.findJobById(jobId);
	if (!job || job.institutionId !== institutionId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
	}

	if (job.status !== "previewed") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot run job in status "${job.status}". Must be "previewed".`,
		});
	}

	const definition = getJobDefinition(job.type as BatchJobType);
	if (!definition) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Job type "${job.type}" is not registered`,
		});
	}

	const parsed = definition.parseParams(job.params);
	const ctx = buildJobContext(job.id, institutionId);

	// Mark as running
	await repo.updateJob(job.id, {
		status: "running" as BatchJobStatus,
		startedAt: new Date(),
		lastHeartbeat: new Date(),
	});

	await ctx.log("info", `Executing ${definition.label}`);

	const steps = job.steps ?? (await repo.getStepsForJob(job.id));
	let itemsProcessedTotal = 0;

	try {
		for (const step of steps) {
			// Update step status to running
			await repo.updateStepStatus(step.id, "running" as BatchJobStepStatus);

			// Update job progress
			await repo.updateJob(job.id, {
				progress: {
					currentStep: step.stepIndex + 1,
					totalSteps: steps.length,
					itemsProcessed: itemsProcessedTotal,
					itemsTotal: job.progress?.itemsTotal ?? 0,
				},
				lastHeartbeat: new Date(),
			});

			await ctx.log(
				"info",
				`Step ${step.stepIndex + 1}/${steps.length}: ${step.name}`,
			);

			try {
				await definition.executeStep(parsed, step, ctx);
				await repo.updateStepStatus(step.id, "completed" as BatchJobStepStatus);
			} catch (stepErr) {
				const msg =
					stepErr instanceof Error ? stepErr.message : String(stepErr);
				await repo.updateStep(step.id, {
					status: "failed" as BatchJobStepStatus,
					error: msg,
					completedAt: new Date(),
				});
				await ctx.log("error", `Step "${step.name}" failed: ${msg}`);
				throw stepErr; // propagate to mark job as failed
			}

			// Refresh step to get processed counts
			const refreshed = await repo.getStepsForJob(job.id);
			itemsProcessedTotal = refreshed.reduce(
				(sum: number, s: { itemsProcessed: number | null }) =>
					sum + (s.itemsProcessed ?? 0),
				0,
			);
		}

		// All steps completed
		await repo.updateJob(job.id, {
			status: "completed" as BatchJobStatus,
			completedAt: new Date(),
			progress: {
				currentStep: steps.length,
				totalSteps: steps.length,
				itemsProcessed: itemsProcessedTotal,
				itemsTotal: job.progress?.itemsTotal ?? 0,
			},
			executionResult: { itemsProcessed: itemsProcessedTotal },
		});

		await ctx.log(
			"info",
			`Job completed: ${itemsProcessedTotal} items processed`,
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		await repo.updateJob(job.id, {
			status: "failed" as BatchJobStatus,
			error: msg,
			failedAt: new Date(),
		});
		await ctx.log("error", `Job failed: ${msg}`);
	}

	return repo.findJobWithLogs(jobId);
}

// ── Cancel ─────────────────────────────────────────────────────────────

export async function cancelJob(jobId: string, institutionId: string) {
	const job = await repo.findJobById(jobId);
	if (!job || job.institutionId !== institutionId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
	}

	const cancellable: BatchJobStatus[] = ["pending", "previewed", "running"];
	if (!cancellable.includes(job.status as BatchJobStatus)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot cancel job in status "${job.status}"`,
		});
	}

	await repo.updateJob(job.id, {
		status: "cancelled" as BatchJobStatus,
		cancelledAt: new Date(),
	});

	const ctx = buildJobContext(job.id, institutionId);
	await ctx.log("info", "Job cancelled");

	return repo.findJobById(jobId);
}

// ── Rollback ───────────────────────────────────────────────────────────

export async function rollbackJob(
	jobId: string,
	institutionId: string,
	createdBy: string | null,
) {
	const job = await repo.findJobById(jobId);
	if (!job || job.institutionId !== institutionId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
	}

	if (job.status !== "completed") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only completed jobs can be rolled back",
		});
	}

	const definition = getJobDefinition(job.type as BatchJobType);
	if (!definition?.rollback) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Job type "${job.type}" does not support rollback`,
		});
	}

	// Create a linked rollback job
	const rollbackJobRecord = await repo.createJob({
		institutionId,
		type: job.type,
		params: job.params,
		status: "running",
		parentJobId: job.id,
		createdBy,
		startedAt: new Date(),
		lastHeartbeat: new Date(),
	});

	// Link original job to rollback
	await repo.updateJob(job.id, {
		rollbackJobId: rollbackJobRecord.id,
		status: "rolled_back" as BatchJobStatus,
		rolledBackAt: new Date(),
	});

	const parsed = definition.parseParams(job.params);
	const ctx = buildJobContext(rollbackJobRecord.id, institutionId);

	await ctx.log("info", `Rolling back job ${job.id}`);

	try {
		await definition.rollback(parsed, ctx);
		await repo.updateJob(rollbackJobRecord.id, {
			status: "completed" as BatchJobStatus,
			completedAt: new Date(),
		});
		await ctx.log("info", "Rollback completed");
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		await repo.updateJob(rollbackJobRecord.id, {
			status: "failed" as BatchJobStatus,
			error: msg,
			failedAt: new Date(),
		});
		await ctx.log("error", `Rollback failed: ${msg}`);
	}

	return repo.findJobWithLogs(rollbackJobRecord.id);
}

// ── Queries ────────────────────────────────────────────────────────────

export async function getJob(jobId: string, institutionId: string) {
	const job = await repo.findJobWithLogs(jobId);
	if (!job || job.institutionId !== institutionId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
	}
	return job;
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
	return repo.listJobs(institutionId, opts);
}

// ── Stale Detection ────────────────────────────────────────────────────

export async function markStaleJobs(thresholdMinutes = 10) {
	const staleJobs = await repo.findStaleJobs(thresholdMinutes);
	for (const job of staleJobs) {
		const ctx = buildJobContext(job.id, job.institutionId);
		await repo.updateJob(job.id, {
			status: "stale" as BatchJobStatus,
			error: `Job heartbeat expired after ${thresholdMinutes} minutes`,
		});
		await ctx.log(
			"warn",
			`Job marked as stale (no heartbeat for ${thresholdMinutes}m)`,
		);
	}
	return staleJobs.length;
}

// ── Internal Helpers ───────────────────────────────────────────────────

function buildJobContext(jobId: string, institutionId: string): JobContext {
	let currentStepId: string | undefined;

	return {
		jobId,
		institutionId,
		async log(level, message, data) {
			await repo.insertLog({
				jobId,
				stepId: currentStepId ?? null,
				level,
				message,
				data: data ?? null,
			});
		},
		async reportStepProgress(stepId, update) {
			currentStepId = stepId;
			await repo.updateStep(stepId, {
				...(update.itemsProcessed !== undefined && {
					itemsProcessed: update.itemsProcessed,
				}),
				...(update.itemsSkipped !== undefined && {
					itemsSkipped: update.itemsSkipped,
				}),
				...(update.itemsFailed !== undefined && {
					itemsFailed: update.itemsFailed,
				}),
			});
			// Also update heartbeat
			await repo.updateHeartbeat(jobId);
		},
	};
}
