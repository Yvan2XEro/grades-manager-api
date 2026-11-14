import type { RouterOutputs } from "@/utils/trpc";

export type BatchJob = NonNullable<RouterOutputs["batchJobs"]["get"]>;
export type BatchJobRow = RouterOutputs["batchJobs"]["list"]["items"][number];

export const BATCH_JOB_STATUSES = [
	"pending",
	"previewed",
	"running",
	"completed",
	"failed",
	"cancelled",
	"stale",
	"rolled_back",
] as const;

/** Jobs that can still be cancelled. */
export const CANCELLABLE_STATUSES = ["pending", "previewed", "running"];

export type LogLevel = "all" | "info" | "warn" | "error";
