import type { BatchJobStep } from "@/db/schema/app-schema";

// ── Job Types ──────────────────────────────────────────────────────────
export const BATCH_JOB_TYPES = [
	"creditLedger.recompute",
	"studentFacts.refreshClass",
	"promotion.applyBatch",
] as const;

export type BatchJobType = (typeof BATCH_JOB_TYPES)[number];

// ── Job Context (passed to handlers) ──────────────────────────────────
export interface JobContext {
	jobId: string;
	institutionId: string;
	/** Log a message attached to the current job (and optionally a step). */
	log: (
		level: "info" | "warn" | "error",
		message: string,
		data?: Record<string, unknown>,
	) => Promise<void>;
	/** Report progress on the current step. */
	reportStepProgress: (
		stepId: string,
		update: {
			itemsProcessed?: number;
			itemsSkipped?: number;
			itemsFailed?: number;
		},
	) => Promise<void>;
}

// ── Step Definition ────────────────────────────────────────────────────
export interface StepDefinition {
	name: string;
	/** Estimated number of items this step will process (set during preview). */
	estimatedItems?: number;
}

// ── Preview Result ─────────────────────────────────────────────────────
export interface PreviewResult {
	steps: StepDefinition[];
	summary: Record<string, unknown>;
	/** Total items across all steps. */
	totalItems: number;
}

// ── Job Definition (registered per type) ───────────────────────────────
export interface BatchJobDefinition<TParams = Record<string, unknown>> {
	type: BatchJobType;
	/** Human-readable label for the job type. */
	label: string;
	/** Validate and parse raw params. Throws on invalid. */
	parseParams: (raw: unknown) => TParams;
	/** Dry-run: compute what would happen without mutating data. */
	preview: (params: TParams, ctx: JobContext) => Promise<PreviewResult>;
	/** Execute each step. Called once per step in order. */
	executeStep: (
		params: TParams,
		step: BatchJobStep,
		ctx: JobContext,
	) => Promise<void>;
	/** Optional: reverse the effects of a completed job. */
	rollback?: (params: TParams, ctx: JobContext) => Promise<void>;
}
