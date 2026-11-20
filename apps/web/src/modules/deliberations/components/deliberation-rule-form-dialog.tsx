import { AlertCircle, Braces, ListChecks, Loader2 } from "lucide-react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeliberationRuleForm } from "../hooks/use-deliberation-rule-form";
import { useRuleScopeOptions } from "../hooks/use-rule-scope-options";
import { RULE_CATEGORIES } from "../services/deliberation-rules";
import {
	DELIBERATION_DECISIONS,
	type DeliberationDecision,
} from "../services/deliberation-status";
import type { RuleFormState } from "../types";
import { RuleConditionEditor } from "./rule-condition-editor";
import { RuleScopeFields } from "./rule-scope-fields";

const FieldError = ({ show, children }: { show: boolean; children: string }) =>
	show ? <p className="text-destructive text-xs">{children}</p> : null;

/** Creates or edits a deliberation rule; resolves `true` once saved. */
export const DeliberationRuleFormDialog = createCallable<
	{ initial?: RuleFormState },
	boolean
>(({ call, initial }) => {
	const { t } = useTranslation();
	const state = useDeliberationRuleForm(initial);
	const { form, patch, errors, showErrors } = state;
	const { programs, levels } = useRuleScopeOptions();

	const save = useMutationFlow(call, async (call) => {
		if (await state.submit()) call.end(true);
	});

	const decisionLabel = form.decision
		? t(`admin.deliberations.decision.${form.decision as DeliberationDecision}`)
		: "…";

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !save.pending && call.end(false)}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>
						{form.id
							? t("admin.deliberations.rules.editTitle")
							: t("admin.deliberations.rules.create")}
					</DialogTitle>
					<DialogDescription>
						{t("admin.deliberations.rules.dialogDescription")}
					</DialogDescription>
				</DialogHeader>

				<DialogBody className="space-y-5 px-6 pb-4">
					<div className="space-y-2">
						<Label htmlFor="rule-name">
							{t("admin.deliberations.rules.name")}
						</Label>
						<Input
							id="rule-name"
							value={form.name}
							onChange={(e) => patch({ name: e.target.value })}
							placeholder={t("admin.deliberations.rules.namePlaceholder")}
							aria-invalid={showErrors && errors.name}
						/>
						<FieldError show={showErrors && errors.name}>
							{t("admin.deliberations.rules.errors.name")}
						</FieldError>
					</div>

					<div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
						<div className="space-y-2">
							<Label htmlFor="rule-category">
								{t("admin.deliberations.rules.category")}
							</Label>
							<Select value={form.category} onValueChange={state.setCategory}>
								<SelectTrigger
									id="rule-category"
									className="w-full"
									aria-invalid={showErrors && errors.category}
								>
									<SelectValue
										placeholder={t(
											"admin.deliberations.rules.categoryPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{RULE_CATEGORIES.map((c, i) => (
										<SelectItem key={c} value={c}>
											{i + 1}. {t(`admin.deliberations.rules.categories.${c}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError show={showErrors && errors.category}>
								{t("admin.deliberations.rules.errors.category")}
							</FieldError>
						</div>

						<div className="space-y-2">
							<Label htmlFor="rule-decision">
								{t("admin.deliberations.rules.decision")}
							</Label>
							<Select
								value={form.decision}
								onValueChange={(decision) => patch({ decision })}
							>
								<SelectTrigger
									id="rule-decision"
									className="w-full"
									aria-invalid={showErrors && errors.decision}
								>
									<SelectValue
										placeholder={t(
											"admin.deliberations.rules.decisionPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{DELIBERATION_DECISIONS.map((d) => (
										<SelectItem key={d} value={d}>
											{t(`admin.deliberations.decision.${d}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError show={showErrors && errors.decision}>
								{t("admin.deliberations.rules.errors.decision")}
							</FieldError>
						</div>

						<div className="space-y-2">
							<Label htmlFor="rule-priority">
								{t("admin.deliberations.rules.priority")}
							</Label>
							<Input
								id="rule-priority"
								type="number"
								min={0}
								step={1}
								value={Number.isNaN(form.priority) ? "" : form.priority}
								onChange={(e) =>
									patch({
										priority:
											e.target.value === ""
												? Number.NaN
												: Number(e.target.value),
									})
								}
								aria-invalid={showErrors && errors.priority}
							/>
						</div>
					</div>
					<p className="-mt-3 text-muted-foreground text-xs">
						{t("admin.deliberations.rules.cascadeHint")}
					</p>
					<FieldError show={showErrors && errors.priority}>
						{t("admin.deliberations.rules.errors.priority")}
					</FieldError>

					<RuleScopeFields
						value={form}
						onChange={patch}
						programs={programs}
						levels={levels}
					/>

					<section className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h3 className="font-medium text-sm">
								{t("admin.deliberations.rules.conditions")}
							</h3>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() =>
									state.setMode(form.mode === "builder" ? "json" : "builder")
								}
							>
								{form.mode === "builder" ? (
									<Braces className="mr-1.5 h-3.5 w-3.5" />
								) : (
									<ListChecks className="mr-1.5 h-3.5 w-3.5" />
								)}
								{form.mode === "builder"
									? t("admin.deliberations.rules.advancedMode")
									: t("admin.deliberations.rules.builderMode")}
							</Button>
						</div>

						{form.mode === "builder" ? (
							<RuleConditionEditor
								builder={form.builder}
								onChange={state.setBuilder}
								problems={state.conditionProblems}
								showErrors={showErrors}
							/>
						) : (
							<div className="space-y-2">
								{state.builderUnavailable && (
									<p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900 text-xs dark:bg-amber-900/20 dark:text-amber-200">
										{t("admin.deliberations.rules.builderUnavailable")}
									</p>
								)}
								<Textarea
									value={form.ruleset}
									onChange={(e) => patch({ ruleset: e.target.value })}
									rows={12}
									className="font-mono text-xs"
									aria-label={t("admin.deliberations.rules.ruleset")}
									aria-invalid={showErrors && !!errors.json}
								/>
								<p className="text-muted-foreground text-xs">
									{t("admin.deliberations.rules.rulesetHelp")}
								</p>
								<FieldError show={showErrors && !!errors.json}>
									{errors.json === "syntax"
										? t("admin.deliberations.rules.invalidJson")
										: t("admin.deliberations.rules.errors.noConditions")}
								</FieldError>
							</div>
						)}
					</section>

					{state.summary && (
						<div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
							<p className="text-muted-foreground text-xs">
								{t("admin.deliberations.rules.summary.title")}
							</p>
							<p>
								{t("admin.deliberations.rules.summary.if")} {state.summary} →{" "}
								<span className="font-medium">{decisionLabel}</span>
							</p>
						</div>
					)}

					<div className="space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Label htmlFor="rule-description">
								{t("admin.deliberations.rules.description")}
							</Label>
							{state.summary && form.description !== state.summary && (
								<Button
									type="button"
									variant="link"
									size="sm"
									className="h-auto p-0 text-xs"
									onClick={() => patch({ description: state.summary ?? "" })}
								>
									{t("admin.deliberations.rules.summary.useAsDescription")}
								</Button>
							)}
						</div>
						<Textarea
							id="rule-description"
							value={form.description}
							onChange={(e) => patch({ description: e.target.value })}
							rows={2}
							placeholder={t(
								"admin.deliberations.rules.descriptionPlaceholder",
							)}
						/>
					</div>

					{state.serverErrors.length > 0 && (
						<Alert
							variant="destructive"
							ref={(el) => el?.scrollIntoView({ block: "nearest" })}
						>
							<AlertCircle />
							<AlertTitle>
								{t("admin.deliberations.rules.serverErrors.title")}
							</AlertTitle>
							<AlertDescription>
								<ul className="list-disc pl-4">
									{state.serverErrors.map((e) => (
										<li key={e}>{e}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					)}
				</DialogBody>

				<DialogFooter>
					<Button
						variant="outline"
						disabled={save.pending}
						onClick={() => call.end(false)}
					>
						{t("common.actions.cancel")}
					</Button>
					<Button onClick={() => save()} disabled={save.pending}>
						{save.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("common.actions.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
