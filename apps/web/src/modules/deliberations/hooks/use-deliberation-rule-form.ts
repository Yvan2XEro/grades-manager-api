import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import {
	defaultDecisionFor,
	emptyRuleForm,
	toRulePayload,
} from "../services/deliberation-rules";
import {
	buildRuleset,
	parseRuleset,
	type RuleBuilder,
	summarizeBuilder,
	validateBuilder,
} from "../services/rule-conditions";
import { ruleSaveErrors } from "../services/rule-errors";
import type { RuleFormState } from "../types";
import { deliberationRulesKey } from "./use-deliberation-rules";

type JsonProblem = "syntax" | "noConditions" | null;

function checkJson(ruleset: string): JsonProblem {
	try {
		const parsed = JSON.parse(ruleset) as { conditions?: unknown } | null;
		return parsed && typeof parsed === "object" && parsed.conditions
			? null
			: "noConditions";
	} catch {
		return "syntax";
	}
}

/**
 * State of the deliberation rule dialog: fields, scope, conditions (builder
 * or JSON), client-side validation and the save with the server's own
 * validation errors kept for inline display.
 */
export function useDeliberationRuleForm(initial?: RuleFormState) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<RuleFormState>(
		() => initial ?? emptyRuleForm(),
	);
	const [showErrors, setShowErrors] = useState(false);
	const [serverErrors, setServerErrors] = useState<string[]>([]);
	/** Set when the JSON could not be shown in the builder. */
	const [builderUnavailable, setBuilderUnavailable] = useState(false);

	const patch = (p: Partial<RuleFormState>) => {
		setForm((f) => ({ ...f, ...p }));
		setServerErrors([]);
	};

	/** The decision follows the category unless the user picked another one. */
	const setCategory = (category: string) =>
		setForm((f) => {
			const followed =
				!f.decision || f.decision === defaultDecisionFor(f.category);
			return {
				...f,
				category,
				decision: followed ? (defaultDecisionFor(category) ?? "") : f.decision,
			};
		});

	const setBuilder = (builder: RuleBuilder) => patch({ builder });

	const setMode = (mode: RuleFormState["mode"]) => {
		if (mode === form.mode) return;
		if (mode === "json") {
			setBuilderUnavailable(false);
			patch({
				mode,
				ruleset: JSON.stringify(buildRuleset(form.builder), null, 2),
			});
			return;
		}
		let builder: RuleBuilder | null = null;
		try {
			builder = parseRuleset(JSON.parse(form.ruleset));
		} catch {
			builder = null;
		}
		if (!builder) {
			setBuilderUnavailable(true);
			return;
		}
		setBuilderUnavailable(false);
		patch({ mode, builder });
	};

	const builderCheck = validateBuilder(form.builder);
	const jsonProblem = form.mode === "json" ? checkJson(form.ruleset) : null;
	const errors = {
		name: !form.name.trim(),
		category: !form.category,
		decision: !form.decision,
		priority: !Number.isInteger(form.priority) || form.priority < 0,
		conditions: form.mode === "builder" && !builderCheck.valid,
		json: jsonProblem,
	};
	const isValid =
		!errors.name &&
		!errors.category &&
		!errors.decision &&
		!errors.priority &&
		!errors.conditions &&
		!errors.json;

	const summary =
		form.mode === "builder" && builderCheck.valid
			? summarizeBuilder(t, form.builder)
			: null;

	/** Saves the rule; resolves `true` once saved. */
	async function submit(): Promise<boolean> {
		setShowErrors(true);
		if (!isValid) return false;
		const payload = toRulePayload(form);
		try {
			if (form.id) {
				await trpcClient.deliberations.rules.update.mutate({
					id: form.id,
					...payload,
				});
				toast.success(t("admin.deliberations.rules.toast.updateSuccess"));
			} else {
				await trpcClient.deliberations.rules.create.mutate({
					...payload,
					description: payload.description ?? undefined,
					programId: payload.programId ?? undefined,
					cycleLevelId: payload.cycleLevelId ?? undefined,
					deliberationType: payload.deliberationType ?? undefined,
				});
				toast.success(t("admin.deliberations.rules.toast.createSuccess"));
			}
			queryClient.invalidateQueries({ queryKey: deliberationRulesKey });
			return true;
		} catch (err) {
			setServerErrors(ruleSaveErrors(t, err));
			return false;
		}
	}

	return {
		form,
		patch,
		setCategory,
		setBuilder,
		setMode,
		builderUnavailable,
		showErrors,
		errors,
		conditionProblems: builderCheck.problems,
		serverErrors,
		summary,
		submit,
	};
}

export type DeliberationRuleFormState = ReturnType<
	typeof useDeliberationRuleForm
>;
