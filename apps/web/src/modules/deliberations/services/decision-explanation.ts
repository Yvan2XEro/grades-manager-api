import {
	type DeliberationDecision,
	isIncompleteResult,
} from "./deliberation-status";

/** Decisions as labelled in the UI ("undecided": no rule decided). */
export type DecisionLabel = DeliberationDecision | "pending" | "undecided";

interface Trace {
	ruleName: string;
	matched: boolean;
	reasons?: string[] | null;
}

interface ExplainableResult {
	finalDecision?: string | null;
	autoDecision?: string | null;
	isOverridden?: boolean | null;
	overrideReason?: string | null;
	rulesEvaluated?: Trace[] | null;
	ueResults?: Array<{ isComplete?: boolean }> | null;
}

/** Why a student result has its decision, for the jury. */
export type DecisionExplanation =
	| { kind: "override"; reason: string | null }
	| { kind: "incomplete" }
	| { kind: "rule"; ruleName: string; reason: string | null }
	| { kind: "noRuleMatched" }
	| { kind: "default" };

/**
 * Why a result has its decision. `computed` explains the computed decision
 * even when the jury overrode it.
 */
export function explainDecision(
	result: ExplainableResult,
	{ computed = false }: { computed?: boolean } = {},
): DecisionExplanation {
	if (result.isOverridden && !computed) {
		return { kind: "override", reason: result.overrideReason ?? null };
	}
	// Incomplete results are never decided by rules nor by the default
	if (isIncompleteResult(result)) return { kind: "incomplete" };
	const traces = result.rulesEvaluated ?? [];
	const matched = traces.find((trace) => trace.matched);
	if (matched) {
		const reason = (matched.reasons ?? []).filter(Boolean).join(" · ");
		return {
			kind: "rule",
			ruleName: matched.ruleName,
			// json-rules-engine falls back to the event type without a message
			reason: reason && reason !== "decision" ? reason : null,
		};
	}
	// Rules were tried and none matched: the jury has to decide. A decision
	// anyway comes from the default computation (results computed before the
	// rules replaced it).
	const decision = computed ? result.autoDecision : result.finalDecision;
	return traces.length > 0 && (decision ?? "pending") === "pending"
		? { kind: "noRuleMatched" }
		: { kind: "default" };
}

/**
 * Translation key suffix of a decision badge: a complete result no rule
 * decided reads "to decide" instead of "incomplete".
 */
export function decisionLabel(
	decision: string,
	result: Pick<ExplainableResult, "ueResults">,
): DecisionLabel {
	return decision === "pending" && !isIncompleteResult(result)
		? "undecided"
		: (decision as DecisionLabel);
}
