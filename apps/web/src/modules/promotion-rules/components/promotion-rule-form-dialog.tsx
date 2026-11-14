import { useQueryClient } from "@tanstack/react-query";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { PromotionRule } from "@/utils/type";
import { promotionRulesKey } from "../hooks/use-promotion-rules";

const DEFAULT_RULESET = {
	name: "default-promotion-rule",
	conditions: {
		all: [
			{
				fact: "overallAverage",
				operator: "greaterThanInclusive",
				value: 10,
			},
			{
				fact: "creditsEarned",
				operator: "greaterThanInclusive",
				value: 30,
			},
			{ fact: "eliminatoryFailures", operator: "equal", value: 0 },
		],
	},
	event: {
		type: "promotion-eligible",
		params: { message: "Student meets standard promotion criteria" },
	},
};

/**
 * Creates or edits a promotion rule (json-rules-engine ruleset);
 * resolves `true` once saved.
 */
export const PromotionRuleFormDialog = createCallable<
	{ rule?: PromotionRule },
	boolean
>(({ call, rule }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const submit = useMutationFlow(call, async (call, formData: FormData) => {
		const rulesetText = formData.get("ruleset") as string;
		let ruleset: Record<string, unknown> | undefined;
		if (rulesetText || !rule) {
			try {
				ruleset = JSON.parse(rulesetText);
			} catch {
				toast.error(t("admin.promotionRules.rulesList.toast.invalidJson"));
				return;
			}
		}
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		try {
			if (rule) {
				await trpcClient.promotionRules.update.mutate({
					id: rule.id,
					name,
					description,
					ruleset,
				});
				toast.success(t("admin.promotionRules.rulesList.toast.updateSuccess"));
			} else {
				await trpcClient.promotionRules.create.mutate({
					name,
					description,
					ruleset: ruleset ?? {},
					isActive: true,
				});
				toast.success(t("admin.promotionRules.rulesList.toast.createSuccess"));
			}
			queryClient.invalidateQueries({ queryKey: promotionRulesKey });
			call.end(true);
		} catch (error) {
			toast.error(
				t(
					rule
						? "admin.promotionRules.rulesList.toast.updateError"
						: "admin.promotionRules.rulesList.toast.createError",
					{ error: (error as Error).message },
				),
			);
		}
	});

	const prefix = rule ? "edit-" : "";

	return (
		<CallableDialog
			call={call}
			dismissValue={false}
			preventDismiss={submit.pending}
			className="max-h-[90vh] sm:max-w-2xl"
			title={t(
				rule
					? "admin.promotionRules.rulesList.dialog.edit.title"
					: "admin.promotionRules.rulesList.dialog.create.title",
			)}
			description={t(
				rule
					? "admin.promotionRules.rulesList.dialog.edit.description"
					: "admin.promotionRules.rulesList.dialog.create.description",
			)}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					submit(new FormData(e.currentTarget));
				}}
				className="space-y-4"
			>
				<div className="space-y-2">
					<Label htmlFor={`${prefix}name`}>
						{t("admin.promotionRules.rulesList.dialog.form.ruleName")}
					</Label>
					<Input
						id={`${prefix}name`}
						name="name"
						defaultValue={rule?.name}
						placeholder={t(
							"admin.promotionRules.rulesList.dialog.form.ruleNamePlaceholder",
						)}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${prefix}description`}>
						{t("admin.promotionRules.rulesList.dialog.form.description")}
					</Label>
					<Textarea
						id={`${prefix}description`}
						name="description"
						defaultValue={rule?.description || ""}
						placeholder={t(
							"admin.promotionRules.rulesList.dialog.form.descriptionPlaceholder",
						)}
						rows={2}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${prefix}ruleset`}>
						{t("admin.promotionRules.rulesList.dialog.form.ruleset")}
					</Label>
					<Textarea
						id={`${prefix}ruleset`}
						name="ruleset"
						placeholder={t(
							"admin.promotionRules.rulesList.dialog.form.rulesetPlaceholder",
						)}
						rows={12}
						defaultValue={JSON.stringify(
							rule?.ruleset ?? DEFAULT_RULESET,
							null,
							2,
						)}
						className="font-mono text-sm"
						required={!rule}
					/>
					{!rule && (
						<p className="text-muted-foreground text-xs">
							{t("admin.promotionRules.rulesList.dialog.form.rulesetHelp")}
						</p>
					)}
				</div>
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(false)}
					>
						{t("admin.promotionRules.rulesList.dialog.actions.cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{rule
							? submit.pending
								? t("admin.promotionRules.rulesList.dialog.actions.saving")
								: t("admin.promotionRules.rulesList.dialog.actions.save")
							: submit.pending
								? t("admin.promotionRules.rulesList.dialog.actions.creating")
								: t("admin.promotionRules.rulesList.dialog.actions.create")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);
