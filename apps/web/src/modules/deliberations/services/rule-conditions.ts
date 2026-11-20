import type { TFunction } from "i18next";
import { formatNumber } from "@/lib/number-format";
import { DELIBERATION_DECISIONS } from "./deliberation-status";

/**
 * Structured view of a deliberation rule's json-rules-engine ruleset: a flat
 * list of conditions joined by "all" (and) or "any" (or), plus the reason the
 * jury reads in the decision trace. Rulesets the builder cannot represent
 * (nested groups, `not`, other facts or operators) stay in JSON.
 */

export const FACT_GROUPS = ["averages", "ues", "credits", "history"] as const;
export type FactGroup = (typeof FACT_GROUPS)[number];

type FactKind = "number" | "count" | "percent" | "decision";

export type FactName =
	| "overallAverage"
	| "lowestUnitAverage"
	| "lowestScore"
	| "failedTeachingUnitsCount"
	| "failedUECount"
	| "compensableUECount"
	| "validatedUECount"
	| "totalUECount"
	| "eliminatoryFailures"
	| "creditsEarned"
	| "creditsAttempted"
	| "creditCompletionRate"
	| "consecutiveRepeats"
	| "previousDeliberationDecision";

interface FactDefinition {
	fact: FactName;
	group: FactGroup;
	kind: FactKind;
}

/** Facts offered by the builder (subset of the server's DELIBERATION_FACTS). */
export const BUILDER_FACTS: readonly FactDefinition[] = [
	{ fact: "overallAverage", group: "averages", kind: "number" },
	{ fact: "lowestUnitAverage", group: "averages", kind: "number" },
	{ fact: "lowestScore", group: "averages", kind: "number" },
	{ fact: "failedTeachingUnitsCount", group: "ues", kind: "count" },
	{ fact: "failedUECount", group: "ues", kind: "count" },
	{ fact: "compensableUECount", group: "ues", kind: "count" },
	{ fact: "validatedUECount", group: "ues", kind: "count" },
	{ fact: "totalUECount", group: "ues", kind: "count" },
	{ fact: "eliminatoryFailures", group: "ues", kind: "count" },
	{ fact: "creditsEarned", group: "credits", kind: "count" },
	{ fact: "creditsAttempted", group: "credits", kind: "count" },
	{ fact: "creditCompletionRate", group: "credits", kind: "percent" },
	{ fact: "consecutiveRepeats", group: "history", kind: "count" },
	{
		fact: "previousDeliberationDecision",
		group: "history",
		kind: "decision",
	},
];

const factByName = new Map<string, FactDefinition>(
	BUILDER_FACTS.map((f) => [f.fact, f]),
);
export const getFact = (fact: string) => factByName.get(fact);

/** Operators of the builder, in reading order, with their symbol. */
export const OPERATORS = [
	{ operator: "lessThan", symbol: "<" },
	{ operator: "lessThanInclusive", symbol: "≤" },
	{ operator: "equal", symbol: "=" },
	{ operator: "greaterThanInclusive", symbol: "≥" },
	{ operator: "greaterThan", symbol: ">" },
	{ operator: "notEqual", symbol: "≠" },
] as const;
export type BuilderOperator = (typeof OPERATORS)[number]["operator"];
const symbolOf = new Map<string, string>(
	OPERATORS.map((o) => [o.operator, o.symbol]),
);

/** Operators that make sense for a fact (a decision is only = or ≠). */
export function operatorsFor(fact: string): readonly BuilderOperator[] {
	return getFact(fact)?.kind === "decision"
		? ["equal", "notEqual"]
		: OPERATORS.map((o) => o.operator);
}

/** Decisions a previous jury may have pronounced. */
export const PREVIOUS_DECISIONS = DELIBERATION_DECISIONS;

export interface ConditionRow {
	fact: string;
	operator: string;
	/** As typed: a number for numeric facts, a decision otherwise. */
	value: string;
}

export interface RuleBuilder {
	match: "all" | "any";
	conditions: ConditionRow[];
	/** Reason shown to the jury when the rule decides. */
	message: string;
}

export const emptyCondition = (): ConditionRow => ({
	fact: "overallAverage",
	operator: "greaterThanInclusive",
	value: "10",
});

export const emptyBuilder = (): RuleBuilder => ({
	match: "all",
	conditions: [emptyCondition()],
	message: "",
});

const parseNumber = (value: string): number | null => {
	const trimmed = value.trim().replace(",", ".");
	if (trimmed === "") return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : null;
};

/** Value displayed in the builder for a stored value (a rate as a percentage). */
function toInputValue(fact: FactDefinition, value: unknown): string | null {
	if (fact.kind === "decision") {
		return typeof value === "string" ? value : null;
	}
	if (typeof value !== "number") return null;
	return fact.kind === "percent"
		? String(Math.round(value * 10000) / 100)
		: String(value);
}

/**
 * The builder view of a ruleset, or `null` when the builder cannot represent
 * it faithfully (the rule then opens in JSON mode).
 */
export function parseRuleset(ruleset: unknown): RuleBuilder | null {
	if (!ruleset || typeof ruleset !== "object") return null;
	const { conditions, event, ...rest } = ruleset as Record<string, unknown>;
	if (Object.keys(rest).some((k) => k !== "name" && k !== "priority")) {
		return null;
	}
	if (!conditions || typeof conditions !== "object") return null;
	const groupKeys = Object.keys(conditions);
	if (groupKeys.length !== 1) return null;
	const match = groupKeys[0];
	if (match !== "all" && match !== "any") return null;
	const leaves = (conditions as Record<string, unknown>)[match];
	if (!Array.isArray(leaves) || leaves.length === 0) return null;

	const rows: ConditionRow[] = [];
	for (const leaf of leaves) {
		if (!leaf || typeof leaf !== "object") return null;
		const { fact, operator, value, ...extra } = leaf as Record<string, unknown>;
		if (Object.keys(extra).length > 0) return null;
		const def = typeof fact === "string" ? getFact(fact) : undefined;
		if (!def || typeof operator !== "string") return null;
		if (!operatorsFor(def.fact).includes(operator as BuilderOperator)) {
			return null;
		}
		const input = toInputValue(def, value);
		if (input === null) return null;
		rows.push({ fact: def.fact, operator, value: input });
	}

	let message = "";
	if (event !== undefined) {
		if (!event || typeof event !== "object") return null;
		const { type, params, ...extra } = event as Record<string, unknown>;
		if (Object.keys(extra).length > 0 || typeof type !== "string") return null;
		if (params !== undefined) {
			if (!params || typeof params !== "object") return null;
			const { message: m, ...other } = params as Record<string, unknown>;
			if (Object.keys(other).length > 0) return null;
			if (m !== undefined && typeof m !== "string") return null;
			message = m ?? "";
		}
	}
	return { match, conditions: rows, message };
}

/** The json-rules-engine ruleset of a builder (assumes it is valid). */
export function buildRuleset(builder: RuleBuilder): Record<string, unknown> {
	const leaves = builder.conditions.map((c) => {
		const def = getFact(c.fact);
		let value: unknown = c.value;
		if (def?.kind !== "decision") {
			const n = parseNumber(c.value) ?? 0;
			value = def?.kind === "percent" ? Math.round(n * 100) / 10000 : n;
		}
		return { fact: c.fact, operator: c.operator, value };
	});
	const message = builder.message.trim();
	return {
		conditions: { [builder.match]: leaves },
		event: {
			type: "decision",
			...(message ? { params: { message } } : {}),
		},
	};
}

export type ConditionProblem =
	| "fact"
	| "operator"
	| "value_number"
	| "value_count"
	| "value_percent"
	| "value_decision";

/** Problems of each condition (same index), plus whether there is none. */
export function validateBuilder(builder: RuleBuilder) {
	const problems = builder.conditions.map((c): ConditionProblem | null => {
		const def = getFact(c.fact);
		if (!def) return "fact";
		if (!operatorsFor(c.fact).includes(c.operator as BuilderOperator)) {
			return "operator";
		}
		const invalid = `value_${def.kind}` as const;
		if (def.kind === "decision") {
			return (PREVIOUS_DECISIONS as readonly string[]).includes(c.value)
				? null
				: invalid;
		}
		const n = parseNumber(c.value);
		if (n === null || n < 0) return invalid;
		if (def.kind === "count" && !Number.isInteger(n)) return invalid;
		if (def.kind === "percent" && n > 100) return invalid;
		return null;
	});
	return {
		problems,
		empty: builder.conditions.length === 0,
		valid: builder.conditions.length > 0 && problems.every((p) => !p),
	};
}

function formatValue(t: TFunction, c: ConditionRow): string {
	const def = getFact(c.fact);
	if (def?.kind === "decision") {
		return (PREVIOUS_DECISIONS as readonly string[]).includes(c.value)
			? t(
					`admin.deliberations.decision.${c.value as (typeof PREVIOUS_DECISIONS)[number]}`,
				)
			: c.value;
	}
	const n = parseNumber(c.value);
	if (n === null) return c.value;
	return def?.kind === "percent" ? `${formatNumber(n)} %` : formatNumber(n);
}

/** One condition in plain words: "Moyenne générale ≥ 10". */
export function describeCondition(t: TFunction, c: ConditionRow): string {
	const def = getFact(c.fact);
	const label = def
		? t(`admin.deliberations.rules.facts.${def.fact}.label`)
		: c.fact;
	return `${label} ${symbolOf.get(c.operator) ?? c.operator} ${formatValue(t, c)}`;
}

/** Auto-generated summary of a builder: "Moyenne < 10 et UE non acquises ≥ 2". */
export function summarizeBuilder(t: TFunction, builder: RuleBuilder): string {
	const joiner = ` ${t(`admin.deliberations.rules.builder.joiner.${builder.match}`)} `;
	return builder.conditions.map((c) => describeCondition(t, c)).join(joiner);
}

/** Summary of a stored ruleset, or `null` when it is an advanced (JSON) one. */
export function summarizeRuleset(t: TFunction, ruleset: unknown) {
	const builder = parseRuleset(ruleset);
	return builder ? summarizeBuilder(t, builder) : null;
}
