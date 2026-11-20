import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { explainDecision } from "../services/decision-explanation";
import type { StudentResult } from "../types";

/**
 * One line saying why a student has their decision: the rule that matched
 * (with its reason), the default LMD computation, no applicable rule, or
 * the jury's override reason. Renders nothing for incomplete results (the
 * missing UEs are shown instead).
 */
export function DecisionExplanation({
	result,
	computed,
	className,
}: {
	result: StudentResult;
	/** Explains the computed decision, ignoring a jury override. */
	computed?: boolean;
	className?: string;
}) {
	const { t } = useTranslation();
	const why = explainDecision(result, { computed });
	if (why.kind === "incomplete") return null;

	let text: string;
	switch (why.kind) {
		case "override":
			text = why.reason
				? t("admin.deliberations.why.override", { reason: why.reason })
				: t("admin.deliberations.why.overrideNoReason");
			break;
		case "rule":
			text = why.reason
				? t("admin.deliberations.why.rule", {
						rule: why.ruleName,
						reason: why.reason,
					})
				: t("admin.deliberations.why.ruleNoReason", { rule: why.ruleName });
			break;
		case "noRuleMatched":
			text = t("admin.deliberations.why.noRuleMatched");
			break;
		default:
			text = t("admin.deliberations.why.default");
	}

	return (
		<p
			className={cn(
				"text-muted-foreground text-xs",
				why.kind === "noRuleMatched" && "text-amber-700 dark:text-amber-400",
				className,
			)}
		>
			{text}
		</p>
	);
}
