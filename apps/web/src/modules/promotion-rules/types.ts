import type { RouterOutputs } from "@/utils/trpc";

export type { PromotionRule } from "@/utils/type";

export type PromotionExecutionItem =
	RouterOutputs["promotionRules"]["listExecutions"]["items"][number];
export type EvaluationResult = RouterOutputs["promotionRules"]["evaluateClass"];

/** Names stored with an execution at the time it ran. */
export type ExecutionMetadata = {
	ruleName?: string;
	sourceClassName?: string;
	targetClassName?: string;
};

/** Student facts recorded with each execution result. */
export type EvaluationData = {
	overallAverage?: number;
	creditsEarned?: number;
	requiredCredits?: number;
	successRate?: number;
};

export type PromotionExecution = {
	id: string;
	status: string;
	createdAt: string;
	metadata?: ExecutionMetadata;
};

/** Selection handed from the evaluate tab to the execute tab (router state). */
export interface PromotionSelection {
	ruleId: string;
	sourceClassId: string;
	academicYearId: string;
	studentIds: string[];
}

/** Payload of `applyPromotion` and of the batch promotion job. */
export interface PromotionPayload {
	ruleId: string;
	sourceClassId: string;
	targetClassId: string;
	academicYearId: string;
	studentIds: string[];
}
