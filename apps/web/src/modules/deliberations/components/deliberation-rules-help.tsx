import { ChevronDown, Lightbulb, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	CATEGORY_DECISION,
	EXAMPLE_RULES,
	RULE_CATEGORIES,
} from "../services/deliberation-rules";
import { decisionVariants } from "../services/deliberation-status";
import { summarizeBuilder } from "../services/rule-conditions";

interface DeliberationRulesHelpProps {
	defaultOpen?: boolean;
	onUseExample: (example: (typeof EXAMPLE_RULES)[number]) => void;
}

/** How the jury applies the rules (cascade, priority, first match), with examples. */
export function DeliberationRulesHelp({
	defaultOpen,
	onUseExample,
}: DeliberationRulesHelpProps) {
	const { t } = useTranslation();
	return (
		<Collapsible
			defaultOpen={defaultOpen}
			className="rounded-xl border bg-muted/30"
		>
			<CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left font-medium text-sm">
				<Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
				<span className="flex-1">
					{t("admin.deliberations.rules.help.title")}
				</span>
				<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-4 px-4 pb-4 text-sm">
				<ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
					<li>
						{t("admin.deliberations.rules.help.order")}
						<span className="mt-1 flex flex-wrap items-center gap-1">
							{RULE_CATEGORIES.map((c, i) => (
								<span key={c} className="flex items-center gap-1">
									{i > 0 && <span aria-hidden="true">→</span>}
									<Badge variant="outline" className="font-normal">
										{t(`admin.deliberations.rules.categories.${c}`)}
									</Badge>
								</span>
							))}
						</span>
					</li>
					<li>{t("admin.deliberations.rules.help.priority")}</li>
					<li>{t("admin.deliberations.rules.help.firstMatch")}</li>
					<li>{t("admin.deliberations.rules.help.noMatch")}</li>
					<li>{t("admin.deliberations.rules.help.incomplete")}</li>
					<li>{t("admin.deliberations.rules.help.noRules")}</li>
				</ol>

				<div>
					<p className="mb-2 font-medium">
						{t("admin.deliberations.rules.help.examplesTitle")}
					</p>
					<ul className="grid gap-2 md:grid-cols-3">
						{EXAMPLE_RULES.map((example) => {
							const decision = CATEGORY_DECISION[example.category];
							return (
								<li
									key={example.key}
									className="flex flex-col gap-2 rounded-lg border bg-card p-3"
								>
									<p className="font-medium">
										{t(
											`admin.deliberations.rules.help.examples.${example.key}.name`,
										)}
									</p>
									<p className="text-muted-foreground text-xs">
										{t("admin.deliberations.rules.summary.if")}{" "}
										{summarizeBuilder(t, example.builder)}
									</p>
									<div className="mt-auto flex items-center justify-between gap-2">
										<Badge variant={decisionVariants[decision] ?? "outline"}>
											{t(`admin.deliberations.decision.${decision}`)}
										</Badge>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onUseExample(example)}
										>
											<Plus className="mr-1 h-3.5 w-3.5" />
											{t("admin.deliberations.rules.help.useExample")}
										</Button>
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
