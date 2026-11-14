import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from "@/components/ui/empty";
import { RuleCard } from "../../components/promotion-rule-card";
import { PromotionRuleFormDialog } from "../../components/promotion-rule-form-dialog";
import {
	usePromotionRuleMutations,
	usePromotionRules,
	useRefreshPromotionRules,
} from "../../hooks/use-promotion-rules";
import type { PromotionRule } from "../../types";

export function RulesListPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: rulesData, isLoading } = usePromotionRules();
	const refresh = useRefreshPromotionRules();
	const { update, remove } = usePromotionRuleMutations();

	const handleDelete = (ruleId: string) =>
		confirmAction({
			title: t("common.confirmDelete", { defaultValue: "Confirm delete" }),
			message: t("admin.promotionRules.rulesList.dialog.deleteConfirm"),
			confirmText: t("common.actions.delete"),
			onConfirm: () =>
				remove.mutateAsync({ id: ruleId }).catch(() => undefined),
		});

	const handleToggleActive = (rule: PromotionRule) =>
		update.mutate({ id: rule.id, isActive: !rule.isActive });

	return (
		<div className="space-y-6">
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
						<Button variant="outline" size="icon" onClick={refresh}>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button onClick={() => PromotionRuleFormDialog.call({})}>
							<Plus className="mr-2 h-4 w-4" />
							{t("admin.promotionRules.rulesList.actions.createRule")}
						</Button>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
					))}
				</div>
			) : rulesData?.items && rulesData.items.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{rulesData.items.map((rule) => (
						<RuleCard
							key={rule.id}
							rule={rule}
							onEdit={() => PromotionRuleFormDialog.call({ rule })}
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
