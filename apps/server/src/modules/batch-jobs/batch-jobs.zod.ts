import { z } from "zod";
import { BATCH_JOB_TYPES } from "./batch-jobs.types";

export const batchJobTypeSchema = z.enum(
	BATCH_JOB_TYPES as unknown as [string, ...string[]],
);

export const previewSchema = z.object({
	type: batchJobTypeSchema,
	params: z.record(z.string(), z.unknown()),
});

export const runSchema = z.object({
	jobId: z.string(),
});

export const cancelSchema = z.object({
	jobId: z.string(),
});

export const rollbackSchema = z.object({
	jobId: z.string(),
});

export const getJobSchema = z.object({
	jobId: z.string(),
});

export const listJobsSchema = z.object({
	status: z
		.array(
			z.enum([
				"pending",
				"previewed",
				"running",
				"completed",
				"failed",
				"cancelled",
				"stale",
				"rolled_back",
			]),
		)
		.optional(),
	type: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});
