import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	FileCog,
	Loader2,
	MoreHorizontal,
	Pencil,
	Plus,
	Power,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { trpcClient } from "../../../utils/trpc";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "../../../components/ui/empty";

const CATEGORIES = [
	"admission",
	"compensation",
	"deferral",
	"repeat",
	"exclusion",
] as const;
const DECISIONS = [
	"admitted",
	"compensated",
	"deferred",
	"repeat",
	"excluded",
] as const;

const DEFAULT_RULESET = JSON.stringify(
	{
		conditions: {
			all: [
				{
					fact: "overallAverage",
					operator: "greaterThanInclusive",
					value: 10,
				},
			],
		},
		event: { type: "decision" },
	},
	null,
	2,
);

interface RuleFormState {
	id?: string;
	name: string;
	description: string;
	category: string;
	decision: string;
	priority: number;
	ruleset: string;
	isActive: boolean;
}

const emptyForm: RuleFormState = {
	name: "",
	description: "",
	category: "",
	decision: "",
	priority: 10,
	ruleset: DEFAULT_RULESET,
	isActive: true,
};

export default function DeliberationRules() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState<RuleFormState>(emptyForm);

	const rulesQuery = useQuery({
		queryKey: ["deliberation-rules"],
		queryFn: () =>
			trpcClient.deliberations.rules.list.query({
				limit: 200,
				offset: 0,
			}),
	});

	const createMutation = useMutation({
		mutationFn: (data: any) =>
			trpcClient.deliberations.rules.create.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.deliberations.rules.toast.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["deliberation-rules"],
			});
			closeDialog();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const updateMutation = useMutation({
		mutationFn: (data: any) =>
			trpcClient.deliberations.rules.update.mutate(data),
		onSuccess: () => {
			toast.success(t("admin.deliberations.rules.toast.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["deliberation-rules"],
			});
			closeDialog();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.deliberations.rules.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.rules.toast.deleteSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["deliberation-rules"],
			});
		},
		onError: (err) => toast.error((err as Error).message),
	});

	function closeDialog() {
		setForm(emptyForm);
		setDialogOpen(false);
	}

	function openEdit(rule: any) {
		setForm({
			id: rule.id,
			name: rule.name,
			description: rule.description ?? "",
			category: rule.category,
			decision: rule.decision,
			priority: rule.priority,
			ruleset: JSON.stringify(rule.ruleset, null, 2),
			isActive: rule.isActive,
		});
		setDialogOpen(true);
	}

	function handleSave() {
		let parsedRuleset: unknown;
		try {
			parsedRuleset = JSON.parse(form.ruleset);
		} catch {
			toast.error(t("admin.deliberations.rules.invalidJson"));
			return;
		}

		const payload = {
			name: form.name,
			description: form.description || undefined,
			category: form.category as (typeof CATEGORIES)[number],
			decision: form.decision as (typeof DECISIONS)[number],
			priority: form.priority,
			ruleset: parsedRuleset as Record<string, unknown>,
			isActive: form.isActive,
		};

		if (form.id) {
			updateMutation.mutate({ id: form.id, ...payload });
		} else {
			createMutation.mutate(payload);
		}
	}

	const rules = rulesQuery.data?.items ?? [];
	const isSaving = createMutation.isPending || updateMutation.isPending;

	// Group rules by category
	const grouped = CATEGORIES.map((cat) => ({
		category: cat,
		rules: rules.filter((r: any) => r.category === cat),
	})).filter((g) => g.rules.length > 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<FileCog className="h-6 w-6 text-primary" />
					<div>
						<h1 className="text-foreground">
							{t("admin.deliberations.rules.title")}
						</h1>
						<p className="text-muted-foreground text-xs">
							{t("admin.deliberations.rules.subtitle")}
						</p>
					</div>
				</div>
				<Button
					onClick={() => {
						setForm(emptyForm);
						setDialogOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.deliberations.rules.create")}
				</Button>
			</div>

			{/* Rules list */}
			{rulesQuery.isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
				</div>
			) : rules.length === 0 ? (
				<Empty className="border border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileCog className="text-muted-foreground" />
					</EmptyMedia>
					<EmptyTitle>{t("admin.deliberations.rules.empty.title")}</EmptyTitle>
					<EmptyDescription>{t("admin.deliberations.rules.empty.description")}</EmptyDescription>
				</EmptyHeader>
			</Empty>
			) : (
				<div className="space-y-6">
					{grouped.map((group) => (
						<div key={group.category}>
							<h2 className="mb-3 font-semibold text-foreground text-sm uppercase tracking-wide">
								{t(`admin.deliberations.rules.categories.${group.category}`)}
							</h2>
							<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
								{group.rules.map((rule: any) => (
									<div
										key={rule.id}
										className="group relative rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
									>
										<div className="flex items-start justify-between">
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<h3 className="truncate font-medium text-sm">
														{rule.name}
													</h3>
													<Badge
														variant={rule.isActive ? "default" : "secondary"}
														className="shrink-0 text-[10px]"
													>
														{rule.isActive
															? t("admin.deliberations.rules.active")
															: t("admin.deliberations.rules.inactive")}
													</Badge>
												</div>
												{rule.description && (
													<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
														{rule.description}
													</p>
												)}
												<div className="mt-2 flex items-center gap-2">
													<Badge variant="outline" className="text-[10px]">
														{t(`admin.deliberations.decision.${rule.decision}`)}
													</Badge>
													<span className="text-[10px] text-muted-foreground">
														P{rule.priority}
													</span>
												</div>
											</div>

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 opacity-0 group-hover:opacity-100"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEdit(rule)}>
														<Pencil className="mr-2 h-4 w-4" />
														{t("common.actions.edit")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															updateMutation.mutate({
																id: rule.id,
																isActive: !rule.isActive,
															})
														}
													>
														<Power className="mr-2 h-4 w-4" />
														{rule.isActive
															? t("admin.deliberations.rules.inactive")
															: t("admin.deliberations.rules.active")}
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => deleteMutation.mutate(rule.id)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														{t("common.actions.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								))}
							</div>
						</div>
					))}

					{/* Show ungrouped rules too */}
					{rules.filter((r: any) => !CATEGORIES.includes(r.category as any))
						.length > 0 && (
						<div>
							<h2 className="mb-3 font-semibold text-foreground text-sm uppercase tracking-wide">
								{t("admin.deliberations.rules.categories.other")}
							</h2>
							<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
								{rules
									.filter((r: any) => !CATEGORIES.includes(r.category as any))
									.map((rule: any) => (
										<div
											key={rule.id}
											className="rounded-xl border bg-card p-4 shadow-sm"
										>
											<p className="font-medium text-sm">{rule.name}</p>
										</div>
									))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Create/Edit dialog */}
			<Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
				<DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{form.id
								? t("common.actions.edit")
								: t("admin.deliberations.rules.create")}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 px-6 pb-4">
						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.name")}</Label>
							<Input
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										name: e.target.value,
									}))
								}
								placeholder={t("admin.deliberations.rules.namePlaceholder")}
							/>
						</div>

						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.description")}</Label>
							<Textarea
								value={form.description}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										description: e.target.value,
									}))
								}
								rows={2}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>{t("admin.deliberations.rules.category")}</Label>
								<Select
									value={form.category}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											category: v,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"admin.deliberations.rules.categoryPlaceholder",
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((c) => (
											<SelectItem key={c} value={c}>
												{t(`admin.deliberations.rules.categories.${c}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("admin.deliberations.rules.decision")}</Label>
								<Select
									value={form.decision}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											decision: v,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DECISIONS.map((d) => (
											<SelectItem key={d} value={d}>
												{t(`admin.deliberations.decision.${d}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.priority")}</Label>
							<Input
								type="number"
								value={form.priority}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										priority: Number(e.target.value),
									}))
								}
								min={1}
							/>
							<p className="text-muted-foreground text-xs">
								{t("admin.deliberations.rules.priorityHelp")}
							</p>
						</div>

						<div className="space-y-2">
							<Label>{t("admin.deliberations.rules.ruleset")}</Label>
							<Textarea
								value={form.ruleset}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										ruleset: e.target.value,
									}))
								}
								rows={8}
								className="font-mono text-xs"
							/>
							<p className="text-muted-foreground text-xs">
								{t("admin.deliberations.rules.rulesetHelp")}
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={closeDialog}>
							{t("common.actions.cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={
								!form.name || !form.category || !form.decision || isSaving
							}
						>
							{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("common.actions.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
