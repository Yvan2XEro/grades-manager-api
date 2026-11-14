import type { RouterOutputs } from "@/utils/trpc";
import type { RuleFormState } from "../types";
import type { DeliberationDecision } from "./deliberation-status";

export type DeliberationRule =
	RouterOutputs["deliberations"]["rules"]["list"]["items"][number];

export const RULE_CATEGORIES = [
	"admission",
	"compensation",
	"deferral",
	"repeat",
	"exclusion",
] as const;
type RuleCategory = (typeof RULE_CATEGORIES)[number];

const DEFAULT_RULESET = JSON.stringify(
	{
		conditions: {
			all: [
				{
					fact: "overallAverage",
					operator: "greaterThanInclusive",
					value: 10,
				},
			],
		},
		event: { type: "decision" },
	},
	null,
	2,
);

export const emptyRuleForm: RuleFormState = {
	name: "",
	description: "",
	category: "",
	decision: "",
	priority: 10,
	ruleset: DEFAULT_RULESET,
	isActive: true,
};

export const toRuleForm = (rule: DeliberationRule): RuleFormState => ({
	id: rule.id,
	name: rule.name,
	description: rule.description ?? "",
	category: rule.category,
	decision: rule.decision,
	priority: rule.priority,
	ruleset: JSON.stringify(rule.ruleset, null, 2),
	isActive: rule.isActive,
});

/** API payload of a rule form; throws a SyntaxError when the ruleset is not JSON. */
export const toRulePayload = (form: RuleFormState) => ({
	name: form.name,
	description: form.description || undefined,
	category: form.category as RuleCategory,
	decision: form.decision as DeliberationDecision,
	priority: form.priority,
	ruleset: JSON.parse(form.ruleset) as Record<string, unknown>,
	isActive: form.isActive,
});

/** Rules grouped by known category, plus the ones of an unknown category. */
export function groupRules(rules: DeliberationRule[]) {
	const known = new Set<string>(RULE_CATEGORIES);
	return {
		groups: RULE_CATEGORIES.map((category) => ({
			category,
			rules: rules.filter((r) => r.category === category),
		})).filter((g) => g.rules.length > 0),
		other: rules.filter((r) => !known.has(r.category)),
	};
}
