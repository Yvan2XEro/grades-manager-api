import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	BUILDER_FACTS,
	type ConditionProblem,
	type ConditionRow,
	emptyCondition,
	FACT_GROUPS,
	getFact,
	OPERATORS,
	operatorsFor,
	PREVIOUS_DECISIONS,
	type RuleBuilder,
} from "../services/rule-conditions";

interface RuleConditionEditorProps {
	builder: RuleBuilder;
	onChange: (builder: RuleBuilder) => void;
	/** Problem of each condition (same index), shown once the user tried to save. */
	problems: (ConditionProblem | null)[];
	showErrors: boolean;
}

/**
 * Structured editor of a rule's conditions: "all" / "any" of a list of
 * fact–operator–value conditions, plus the reason shown to the jury.
 */
export function RuleConditionEditor({
	builder,
	onChange,
	problems,
	showErrors,
}: RuleConditionEditorProps) {
	const { t } = useTranslation();

	const updateRow = (index: number, patch: Partial<ConditionRow>) =>
		onChange({
			...builder,
			conditions: builder.conditions.map((c, i) =>
				i === index ? { ...c, ...patch } : c,
			),
		});

	const changeFact = (index: number, fact: string) => {
		const current = builder.conditions[index];
		const def = getFact(fact);
		const wasDecision = getFact(current.fact)?.kind === "decision";
		const isDecision = def?.kind === "decision";
		const operators = operatorsFor(fact);
		updateRow(index, {
			fact,
			operator: (operators as readonly string[]).includes(current.operator)
				? current.operator
				: operators[0],
			// A number does not make sense as a decision (and vice versa)
			value:
				wasDecision === isDecision ? current.value : isDecision ? "repeat" : "",
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span>{t("admin.deliberations.rules.builder.matchPrefix")}</span>
				<Select
					value={builder.match}
					onValueChange={(v) =>
						onChange({ ...builder, match: v as RuleBuilder["match"] })
					}
				>
					<SelectTrigger className="h-8 w-auto">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("admin.deliberations.rules.builder.match.all")}
						</SelectItem>
						<SelectItem value="any">
							{t("admin.deliberations.rules.builder.match.any")}
						</SelectItem>
					</SelectContent>
				</Select>
				<span>{t("admin.deliberations.rules.builder.matchSuffix")}</span>
			</div>

			<ul className="space-y-2">
				{builder.conditions.map((condition, index) => {
					const def = getFact(condition.fact);
					const problem = showErrors ? problems[index] : null;
					return (
						<li
							// Conditions have no id; their position is their identity
							key={index}
							className={cn(
								"rounded-lg border bg-muted/20 p-3",
								problem && "border-destructive/60",
							)}
						>
							{index > 0 && (
								<p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
									{t(
										`admin.deliberations.rules.builder.joiner.${builder.match}`,
									)}
								</p>
							)}
							<div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_7rem_auto]">
								<Select
									value={def ? condition.fact : undefined}
									onValueChange={(v) => changeFact(index, v)}
								>
									<SelectTrigger
										className="col-span-2 w-full sm:col-span-1"
										aria-label={t("admin.deliberations.rules.builder.fact")}
										aria-invalid={problem === "fact"}
									>
										<SelectValue
											placeholder={t(
												"admin.deliberations.rules.builder.factPlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{FACT_GROUPS.map((group) => (
											<SelectGroup key={group}>
												<SelectLabel>
													{t(`admin.deliberations.rules.factGroups.${group}`)}
												</SelectLabel>
												{BUILDER_FACTS.filter((f) => f.group === group).map(
													(f) => (
														<SelectItem key={f.fact} value={f.fact}>
															{t(
																`admin.deliberations.rules.facts.${f.fact}.label`,
															)}
														</SelectItem>
													),
												)}
											</SelectGroup>
										))}
									</SelectContent>
								</Select>

								<Select
									value={condition.operator}
									onValueChange={(v) => updateRow(index, { operator: v })}
								>
									<SelectTrigger
										className="w-full"
										aria-label={t("admin.deliberations.rules.builder.operator")}
										aria-invalid={problem === "operator"}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{OPERATORS.filter((o) =>
											operatorsFor(condition.fact).includes(o.operator),
										).map((o) => (
											<SelectItem key={o.operator} value={o.operator}>
												<span className="w-4 font-mono">{o.symbol}</span>
												{t(
													`admin.deliberations.rules.builder.operators.${o.operator}`,
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{def?.kind === "decision" ? (
									<Select
										value={condition.value}
										onValueChange={(v) => updateRow(index, { value: v })}
									>
										<SelectTrigger
											className="w-full"
											aria-label={t("admin.deliberations.rules.builder.value")}
											aria-invalid={!!problem?.startsWith("value")}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PREVIOUS_DECISIONS.map((d) => (
												<SelectItem key={d} value={d}>
													{t(`admin.deliberations.decision.${d}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<div className="relative">
										<Input
											inputMode="decimal"
											value={condition.value}
											onChange={(e) =>
												updateRow(index, { value: e.target.value })
											}
											aria-label={t("admin.deliberations.rules.builder.value")}
											aria-invalid={!!problem?.startsWith("value")}
											className={cn(def?.kind === "percent" && "pr-7")}
										/>
										{def?.kind === "percent" && (
											<span className="-translate-y-1/2 absolute top-1/2 right-2.5 text-muted-foreground text-sm">
												%
											</span>
										)}
									</div>
								)}

								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={builder.conditions.length === 1}
									onClick={() =>
										onChange({
											...builder,
											conditions: builder.conditions.filter(
												(_, i) => i !== index,
											),
										})
									}
									aria-label={t("admin.deliberations.rules.builder.remove")}
									title={t("admin.deliberations.rules.builder.remove")}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
							{def && (
								<p className="mt-1.5 text-muted-foreground text-xs">
									{t(`admin.deliberations.rules.facts.${def.fact}.help`)}
								</p>
							)}
							{problem && (
								<p className="mt-1 text-destructive text-xs">
									{t(`admin.deliberations.rules.builder.problems.${problem}`)}
								</p>
							)}
						</li>
					);
				})}
			</ul>

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() =>
					onChange({
						...builder,
						conditions: [...builder.conditions, emptyCondition()],
					})
				}
			>
				<Plus className="mr-1.5 h-3.5 w-3.5" />
				{t("admin.deliberations.rules.builder.add")}
			</Button>

			<div className="space-y-2">
				<Label htmlFor="rule-message">
					{t("admin.deliberations.rules.builder.message")}
				</Label>
				<Input
					id="rule-message"
					value={builder.message}
					onChange={(e) => onChange({ ...builder, message: e.target.value })}
					placeholder={t(
						"admin.deliberations.rules.builder.messagePlaceholder",
					)}
				/>
				<p className="text-muted-foreground text-xs">
					{t("admin.deliberations.rules.builder.messageHelp")}
				</p>
			</div>
		</div>
	);
}
