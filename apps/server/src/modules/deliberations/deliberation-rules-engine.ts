import { Engine } from "json-rules-engine";
import type {
	DeliberationDecision,
	DeliberationRule,
} from "@/db/schema/app-schema";
import type {
	DeliberationFacts,
	RuleEvaluationTrace,
} from "./deliberations.types";

/**
 * Category evaluation order for the cascade.
 * The first category that produces a match wins.
 */
const CATEGORY_ORDER = [
	"exclusion",
	"repeat",
	"deferral",
	"compensation",
	"admission",
] as const;

/**
 * Evaluate a student against a single rule using json-rules-engine.
 */
async function evaluateAgainstRule(
	rule: DeliberationRule,
	facts: DeliberationFacts,
): Promise<{ matched: boolean; reasons: string[] }> {
	const engine = new Engine([rule.ruleset as never], {
		allowUndefinedFacts: true,
	});

	const result = await engine.run(facts as never);
	const matched = result.events.length > 0;
	const reasons = result.events.map(
		(e) => (e.params?.message as string) || e.type,
	);

	return { matched, reasons };
}

/**
 * Evaluate a student against all applicable rules in cascade order.
 *
 * The cascade works as follows:
 * 1. Rules are grouped by category in order: exclusion → repeat → deferral → compensation → admission
 * 2. Within each category, rules are evaluated in priority order (lower = first)
 * 3. The first category that has a matching rule wins; its decision is applied
 * 4. If no rule matches, the student gets "pending"
 */
export async function evaluateStudent(
	rules: DeliberationRule[],
	facts: DeliberationFacts,
): Promise<{
	decision: DeliberationDecision;
	traces: RuleEvaluationTrace[];
}> {
	const traces: RuleEvaluationTrace[] = [];
	let finalDecision: DeliberationDecision = "pending";

	// Group rules by category
	const rulesByCategory = new Map<string, DeliberationRule[]>();
	for (const rule of rules) {
		const existing = rulesByCategory.get(rule.category) ?? [];
		existing.push(rule);
		rulesByCategory.set(rule.category, existing);
	}

	// Evaluate in cascade order
	for (const category of CATEGORY_ORDER) {
		const categoryRules = rulesByCategory.get(category);
		if (!categoryRules || categoryRules.length === 0) continue;

		// Sort by priority within category (already sorted from repo, but be safe)
		categoryRules.sort((a, b) => a.priority - b.priority);

		for (const rule of categoryRules) {
			try {
				const { matched, reasons } = await evaluateAgainstRule(rule, facts);

				traces.push({
					ruleId: rule.id,
					ruleName: rule.name,
					category: rule.category,
					matched,
					decision: matched ? rule.decision : null,
					reasons,
				});

				if (matched) {
					finalDecision = rule.decision;
					// First match in the cascade wins — stop evaluating
					return { decision: finalDecision, traces };
				}
			} catch {
				// Log but don't crash on individual rule failure
				traces.push({
					ruleId: rule.id,
					ruleName: rule.name,
					category: rule.category,
					matched: false,
					decision: null,
					reasons: ["Rule evaluation error"],
				});
			}
		}
	}

	return { decision: finalDecision, traces };
}
