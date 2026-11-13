import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { PromotionRule } from "@/utils/type";
import { RuleCard } from "./rule-card";

export function RulesListPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const queryClient = useQueryClient();

	// Fetch rules
	const { data: rulesData, isLoading } = useQuery({
		queryKey: ["promotionRules"],
		queryFn: async () => trpcClient.promotionRules.list.query({}),
	});

	// Mutations
	const updateMutation = useMutation({
		mutationFn: async (data: {
			id: string;
			name?: string;
			description?: string;
			ruleset?: Record<string, unknown>;
			isActive?: boolean;
		}) => trpcClient.promotionRules.update.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
		},
		onError: (error: Error) => {
			toast.error(
				t("admin.promotionRules.rulesList.toast.updateError", {
					error: error.message,
				}),
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (data: { id: string }) =>
			trpcClient.promotionRules.delete.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
		},
		onError: (error: Error) => {
			toast.error(
				t("admin.promotionRules.rulesList.toast.deleteError", {
					error: error.message,
				}),
			);
		},
	});

	const handleEdit = (rule: PromotionRule) =>
		PromotionRuleFormDialog.call({ rule });

	const handleDelete = (ruleId: string) =>
		confirmAction({
			title: t("common.confirmDelete", { defaultValue: "Confirm delete" }),
			message: t("admin.promotionRules.rulesList.dialog.deleteConfirm"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				deleteMutation.mutateAsync({ id: ruleId }).catch(() => undefined),
		});

	const handleToggleActive = (rule: PromotionRule) => {
		updateMutation.mutate({
			id: rule.id,
			isActive: !rule.isActive,
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/promotion-legacy")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-foreground">
							{t("admin.promotionRules.rulesList.title")}
						</h1>
						<p className="mt-1 text-muted-foreground">
							{t("admin.promotionRules.rulesList.subtitle")}
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								queryClient.invalidateQueries({
									queryKey: ["promotionRules"],
								})
							}
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button onClick={() => PromotionRuleFormDialog.call({})}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.promotionRules.rulesList.actions.createRule")}
						</Button>
					</div>
				</div>
			</div>

			{/* Rules Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
					))}
				</div>
			) : rulesData?.items && rulesData.items.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{rulesData.items?.map((rule) => (
						<RuleCard
							key={rule.id}
							rule={rule}
							onEdit={() => handleEdit(rule)}
							onDelete={() => handleDelete(rule.id)}
							onToggleActive={() => handleToggleActive(rule)}
						/>
					))}
				</div>
			) : (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyDescription>
							{t("admin.promotionRules.rulesList.emptyState.noRules")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							onClick={() => PromotionRuleFormDialog.call({})}
						>
							{t("admin.promotionRules.rulesList.emptyState.createFirst")}
						</Button>
					</EmptyContent>
				</Empty>
			)}
		</div>
	);
}

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
			queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
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
