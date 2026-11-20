import type { RouterOutputs } from "@/utils/trpc";
import type { RuleFormState } from "../types";
import type {
	DeliberationDecision,
	DeliberationType,
} from "./deliberation-status";
import {
	buildRuleset,
	emptyBuilder,
	parseRuleset,
	type RuleBuilder,
} from "./rule-conditions";

export type DeliberationRule =
	RouterOutputs["deliberations"]["rules"]["list"]["items"][number];

/** Categories in the order the engine evaluates them (first match wins). */
export const RULE_CATEGORIES = [
	"exclusion",
	"repeat",
	"deferral",
	"compensation",
	"admission",
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

/** Decision a rule of each category produces unless the user picks another. */
export const CATEGORY_DECISION: Record<RuleCategory, DeliberationDecision> = {
	exclusion: "excluded",
	repeat: "repeat",
	deferral: "deferred",
	compensation: "compensated",
	admission: "admitted",
};

export const defaultDecisionFor = (category: string) =>
	CATEGORY_DECISION[category as RuleCategory] as string | undefined;

export const emptyRuleForm = (): RuleFormState => {
	const builder = emptyBuilder();
	return {
		name: "",
		description: "",
		category: "",
		decision: "",
		priority: 10,
		isActive: true,
		programId: null,
		cycleLevelId: null,
		deliberationType: null,
		mode: "builder",
		builder,
		ruleset: JSON.stringify(buildRuleset(builder), null, 2),
	};
};

/** Form state of a rule: opens in JSON mode when the builder cannot show it. */
export const toRuleForm = (rule: DeliberationRule): RuleFormState => {
	const builder = parseRuleset(rule.ruleset);
	return {
		id: rule.id,
		name: rule.name,
		description: rule.description ?? "",
		category: rule.category,
		decision: rule.decision,
		priority: rule.priority,
		isActive: rule.isActive,
		programId: rule.programId ?? null,
		cycleLevelId: rule.cycleLevelId ?? null,
		deliberationType: rule.deliberationType ?? null,
		mode: builder ? "builder" : "json",
		builder: builder ?? emptyBuilder(),
		ruleset: JSON.stringify(rule.ruleset, null, 2),
	};
};

/**
 * API payload of a rule form; throws a SyntaxError when the JSON ruleset does
 * not parse. Scope fields are sent as `null` for "all" so an update clears them.
 */
export const toRulePayload = (form: RuleFormState) => ({
	name: form.name.trim(),
	description: form.description.trim() || null,
	category: form.category as RuleCategory,
	decision: form.decision as DeliberationDecision,
	priority: form.priority,
	ruleset:
		form.mode === "builder"
			? buildRuleset(form.builder)
			: (JSON.parse(form.ruleset) as Record<string, unknown>),
	isActive: form.isActive,
	programId: form.programId,
	cycleLevelId: form.cycleLevelId,
	deliberationType: form.deliberationType as DeliberationType | null,
});

/** Rules grouped by known category (cascade order), plus unknown categories. */
export function groupRules(rules: DeliberationRule[]) {
	const known = new Set<string>(RULE_CATEGORIES);
	return {
		groups: RULE_CATEGORIES.map((category) => ({
			category,
			rules: rules
				.filter((r) => r.category === category)
				.sort((a, b) => a.priority - b.priority),
		})).filter((g) => g.rules.length > 0),
		other: rules.filter((r) => !known.has(r.category)),
	};
}

/** Example rules shown in the help panel; each can prefill a new rule. */
export const EXAMPLE_RULES: Array<{
	key: "exclusion" | "repeat" | "compensation";
	category: RuleCategory;
	builder: RuleBuilder;
}> = [
	{
		key: "exclusion",
		category: "exclusion",
		builder: {
			match: "all",
			conditions: [
				{
					fact: "consecutiveRepeats",
					operator: "greaterThanInclusive",
					value: "2",
				},
			],
			message: "",
		},
	},
	{
		key: "repeat",
		category: "repeat",
		builder: {
			match: "all",
			conditions: [
				{ fact: "overallAverage", operator: "lessThan", value: "7" },
			],
			message: "",
		},
	},
	{
		key: "compensation",
		category: "compensation",
		builder: {
			match: "all",
			conditions: [
				{
					fact: "overallAverage",
					operator: "greaterThanInclusive",
					value: "10",
				},
				{
					fact: "failedTeachingUnitsCount",
					operator: "lessThanInclusive",
					value: "2",
				},
				{ fact: "eliminatoryFailures", operator: "equal", value: "0" },
			],
			message: "",
		},
	},
];

/** A new rule prefilled from an example (name and reason in the UI language). */
export function exampleRuleForm(
	example: (typeof EXAMPLE_RULES)[number],
	texts: { name: string; message: string },
): RuleFormState {
	const builder = { ...example.builder, message: texts.message };
	return {
		...emptyRuleForm(),
		name: texts.name,
		category: example.category,
		decision: CATEGORY_DECISION[example.category],
		builder,
		ruleset: JSON.stringify(buildRuleset(builder), null, 2),
	};
}
