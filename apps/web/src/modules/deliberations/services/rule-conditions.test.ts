import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { explainDecision } from "./decision-explanation";
import {
	buildRuleset,
	parseRuleset,
	type RuleBuilder,
	summarizeBuilder,
	validateBuilder,
} from "./rule-conditions";

// Returns the key, so the summary shows which labels it used
const t = ((key: string) => key) as unknown as TFunction;

describe("rule conditions builder", () => {
	const builder: RuleBuilder = {
		match: "all",
		conditions: [
			{ fact: "overallAverage", operator: "lessThan", value: "9,5" },
			{ fact: "creditCompletionRate", operator: "lessThan", value: "50" },
			{
				fact: "previousDeliberationDecision",
				operator: "equal",
				value: "repeat",
			},
		],
		message: "Too low",
	};

	it("builds a json-rules-engine ruleset (comma decimals, rates as ratios)", () => {
		expect(buildRuleset(builder)).toEqual({
			conditions: {
				all: [
					{ fact: "overallAverage", operator: "lessThan", value: 9.5 },
					{ fact: "creditCompletionRate", operator: "lessThan", value: 0.5 },
					{
						fact: "previousDeliberationDecision",
						operator: "equal",
						value: "repeat",
					},
				],
			},
			event: { type: "decision", params: { message: "Too low" } },
		});
	});

	it("reads back what it builds", () => {
		expect(parseRuleset(buildRuleset(builder))).toEqual({
			...builder,
			conditions: builder.conditions.map((c) =>
				c.fact === "overallAverage" ? { ...c, value: "9.5" } : c,
			),
		});
	});

	it("refuses rulesets it cannot represent", () => {
		const nested = {
			conditions: {
				all: [
					{ any: [{ fact: "overallAverage", operator: "lessThan", value: 7 }] },
				],
			},
			event: { type: "decision" },
		};
		expect(parseRuleset(nested)).toBeNull();
		expect(
			parseRuleset({
				conditions: {
					all: [{ fact: "programCode", operator: "equal", value: "INF" }],
				},
			}),
		).toBeNull();
		expect(
			parseRuleset({
				conditions: {
					all: [{ fact: "overallAverage", operator: "in", value: [1] }],
				},
			}),
		).toBeNull();
		expect(parseRuleset({ conditions: { all: [] } })).toBeNull();
	});

	it("flags invalid values per condition", () => {
		const check = validateBuilder({
			match: "any",
			conditions: [
				{ fact: "failedUECount", operator: "greaterThan", value: "1.5" },
				{ fact: "creditCompletionRate", operator: "lessThan", value: "150" },
				{ fact: "overallAverage", operator: "lessThan", value: "" },
				{ fact: "overallAverage", operator: "lessThan", value: "8" },
			],
			message: "",
		});
		expect(check.problems).toEqual([
			"value_count",
			"value_percent",
			"value_number",
			null,
		]);
		expect(check.valid).toBe(false);
	});

	it("summarizes the conditions in plain words", () => {
		expect(
			summarizeBuilder(t, {
				match: "any",
				conditions: [
					{ fact: "overallAverage", operator: "lessThan", value: "7" },
					{
						fact: "consecutiveRepeats",
						operator: "greaterThanInclusive",
						value: "2",
					},
				],
				message: "",
			}),
		).toBe(
			"admin.deliberations.rules.facts.overallAverage.label < 7 admin.deliberations.rules.builder.joiner.any admin.deliberations.rules.facts.consecutiveRepeats.label ≥ 2",
		);
	});
});

describe("explainDecision", () => {
	const complete = { ueResults: [{ isComplete: true }] };

	it("names the rule that matched, with its reason", () => {
		expect(
			explainDecision({
				...complete,
				finalDecision: "repeat",
				rulesEvaluated: [
					{ ruleName: "Excluded", matched: false, reasons: [] },
					{ ruleName: "Low", matched: true, reasons: ["Average below 7"] },
				],
			}),
		).toEqual({ kind: "rule", ruleName: "Low", reason: "Average below 7" });
	});

	it("tells the default computation from no applicable rule", () => {
		expect(explainDecision({ ...complete, rulesEvaluated: [] })).toEqual({
			kind: "default",
		});
		expect(
			explainDecision({
				...complete,
				finalDecision: "pending",
				rulesEvaluated: [{ ruleName: "Low", matched: false, reasons: [] }],
			}),
		).toEqual({ kind: "noRuleMatched" });
		// Computed before rules replaced the default: the default decided
		expect(
			explainDecision({
				...complete,
				finalDecision: "compensated",
				rulesEvaluated: [{ ruleName: "Low", matched: false, reasons: [] }],
			}),
		).toEqual({ kind: "default" });
	});

	it("shows the override reason, unless the computed decision is asked", () => {
		const overridden = {
			...complete,
			isOverridden: true,
			overrideReason: "Medical certificate",
			rulesEvaluated: [],
		};
		expect(explainDecision(overridden)).toEqual({
			kind: "override",
			reason: "Medical certificate",
		});
		expect(explainDecision(overridden, { computed: true })).toEqual({
			kind: "default",
		});
	});
});
