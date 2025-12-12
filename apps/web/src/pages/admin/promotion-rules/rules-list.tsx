import { RuleCard } from "@/components/promotion-rules/rule-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpcClient } from "@/utils/trpc";
import { Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function RulesListPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingRule, setEditingRule] = useState<any>(null);

	const queryClient = useQueryClient();

	// Fetch rules
	const { data: rulesData, isLoading } = useQuery({
		queryKey: ["promotionRules"],
		queryFn: async () => trpcClient.promotionRules.list.query({}),
	});

	// Mutations
	const createMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			description: string;
			ruleset: Record<string, unknown>;
			isActive: boolean;
		}) => trpcClient.promotionRules.create.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
			setIsCreateDialogOpen(false);
		},
		onError: (error: any) => {
			toast.error(t("admin.promotionRules.rulesList.toast.createError", { error: error.message }));
		},
	});

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
			setIsEditDialogOpen(false);
		},
		onError: (error: any) => {
			toast.error(t("admin.promotionRules.rulesList.toast.updateError", { error: error.message }));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (data: { id: string }) =>
			trpcClient.promotionRules.delete.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.promotionRules.rulesList.toast.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
		},
		onError: (error: any) => {
			toast.error(t("admin.promotionRules.rulesList.toast.deleteError", { error: error.message }));
		},
	});

	const handleCreateRule = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const rulesetText = formData.get("ruleset") as string;
		let ruleset: Record<string, unknown>;

		try {
			ruleset = JSON.parse(rulesetText);
		} catch (error) {
			toast.error(t("admin.promotionRules.rulesList.toast.invalidJson"));
			return;
		}

		createMutation.mutate({
			name: formData.get("name") as string,
			description: formData.get("description") as string,
			ruleset,
			isActive: true,
		});
	};

	const handleUpdateRule = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingRule) return;

		const formData = new FormData(e.currentTarget);
		const rulesetText = formData.get("ruleset") as string;
		let ruleset: Record<string, unknown> | undefined;

		if (rulesetText) {
			try {
				ruleset = JSON.parse(rulesetText);
			} catch (error) {
				toast.error(t("admin.promotionRules.rulesList.toast.invalidJson"));
				return;
			}
		}

		updateMutation.mutate({
			id: editingRule.id,
			name: formData.get("name") as string,
			description: formData.get("description") as string,
			ruleset,
		});
	};

	const handleEdit = (rule: any) => {
		setEditingRule(rule);
		setIsEditDialogOpen(true);
	};

	const handleDelete = (ruleId: string) => {
		if (confirm(t("admin.promotionRules.rulesList.dialog.deleteConfirm"))) {
			deleteMutation.mutate({ id: ruleId });
		}
	};

	const handleToggleActive = (rule: any) => {
		updateMutation.mutate({
			id: rule.id,
			isActive: !rule.isActive,
		});
	};

	const defaultRuleset = {
		name: "default-promotion-rule",
		conditions: {
			all: [
				{ fact: "overallAverage", operator: "greaterThanInclusive", value: 10 },
				{ fact: "creditsEarned", operator: "greaterThanInclusive", value: 30 },
				{ fact: "eliminatoryFailures", operator: "equal", value: 0 },
			],
		},
		event: {
			type: "promotion-eligible",
			params: { message: "Student meets standard promotion criteria" },
		},
	};

	return (
		<div className="container mx-auto py-8 space-y-6">
			{/* Header */}
			<div className="space-y-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/admin/promotion-rules")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.actions.back")}
				</Button>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{t("admin.promotionRules.rulesList.title")}</h1>
						<p className="text-muted-foreground mt-1">
							{t("admin.promotionRules.rulesList.subtitle")}
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => queryClient.invalidateQueries({ queryKey: ["promotionRules"] })}
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button onClick={() => setIsCreateDialogOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							{t("admin.promotionRules.rulesList.actions.createRule")}
						</Button>
					</div>
				</div>
			</div>

			{/* Rules Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
					))}
				</div>
			) : rulesData?.items && rulesData.items.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
				<div className="text-center py-12">
					<p className="text-muted-foreground">{t("admin.promotionRules.rulesList.emptyState.noRules")}</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => setIsCreateDialogOpen(true)}
					>
						{t("admin.promotionRules.rulesList.emptyState.createFirst")}
					</Button>
				</div>
			)}

			{/* Create Dialog */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.promotionRules.rulesList.dialog.create.title")}</DialogTitle>
						<DialogDescription>
							{t("admin.promotionRules.rulesList.dialog.create.description")}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateRule} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">{t("admin.promotionRules.rulesList.dialog.form.ruleName")}</Label>
							<Input
								id="name"
								name="name"
								placeholder={t("admin.promotionRules.rulesList.dialog.form.ruleNamePlaceholder")}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">{t("admin.promotionRules.rulesList.dialog.form.description")}</Label>
							<Textarea
								id="description"
								name="description"
								placeholder={t("admin.promotionRules.rulesList.dialog.form.descriptionPlaceholder")}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ruleset">{t("admin.promotionRules.rulesList.dialog.form.ruleset")}</Label>
							<Textarea
								id="ruleset"
								name="ruleset"
								placeholder={t("admin.promotionRules.rulesList.dialog.form.rulesetPlaceholder")}
								rows={12}
								defaultValue={JSON.stringify(defaultRuleset, null, 2)}
								className="font-mono text-sm"
								required
							/>
							<p className="text-xs text-muted-foreground">
								{t("admin.promotionRules.rulesList.dialog.form.rulesetHelp")}
							</p>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								{t("admin.promotionRules.rulesList.dialog.actions.cancel")}
							</Button>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? t("admin.promotionRules.rulesList.dialog.actions.creating") : t("admin.promotionRules.rulesList.dialog.actions.create")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("admin.promotionRules.rulesList.dialog.edit.title")}</DialogTitle>
						<DialogDescription>{t("admin.promotionRules.rulesList.dialog.edit.description")}</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleUpdateRule} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">{t("admin.promotionRules.rulesList.dialog.form.ruleName")}</Label>
							<Input
								id="edit-name"
								name="name"
								defaultValue={editingRule?.name}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-description">{t("admin.promotionRules.rulesList.dialog.form.description")}</Label>
							<Textarea
								id="edit-description"
								name="description"
								defaultValue={editingRule?.description || ""}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-ruleset">{t("admin.promotionRules.rulesList.dialog.form.ruleset")}</Label>
							<Textarea
								id="edit-ruleset"
								name="ruleset"
								defaultValue={JSON.stringify(editingRule?.ruleset, null, 2)}
								rows={12}
								className="font-mono text-sm"
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditDialogOpen(false)}
							>
								{t("admin.promotionRules.rulesList.dialog.actions.cancel")}
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? t("admin.promotionRules.rulesList.dialog.actions.saving") : t("admin.promotionRules.rulesList.dialog.actions.save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
