import { FileCog, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { confirmAction } from "@/components/callable/confirm";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { DeliberationRuleCard } from "../components/deliberation-rule-card";
import { DeliberationRuleFormDialog } from "../components/deliberation-rule-form-dialog";
import { DeliberationRulesHelp } from "../components/deliberation-rules-help";
import {
	useDeliberationRuleMutations,
	useDeliberationRules,
} from "../hooks/use-deliberation-rules";
import { useRuleScopeOptions } from "../hooks/use-rule-scope-options";
import {
	type DeliberationRule,
	exampleRuleForm,
	groupRules,
	toRuleForm,
} from "../services/deliberation-rules";

export default function DeliberationRules() {
	const { t } = useTranslation();
	const { rules, isLoading } = useDeliberationRules();
	const { setActive, remove } = useDeliberationRuleMutations();
	const { programLabel, levelLabel } = useRuleScopeOptions();

	const confirmDelete = (rule: { id: string; name: string }) =>
		confirmAction({
			title: t("admin.deliberations.rules.confirmDelete.title"),
			message: t("admin.deliberations.rules.confirmDelete.message", {
				name: rule.name,
			}),
			confirmText: t("common.actions.delete"),
			onConfirm: () => remove.mutateAsync(rule.id).catch(() => undefined),
		});

	const { groups, other } = groupRules(rules);

	const renderCard = (rule: DeliberationRule) => (
		<DeliberationRuleCard
			key={rule.id}
			rule={rule}
			programLabel={rule.programId ? programLabel(rule.programId) : undefined}
			levelLabel={rule.cycleLevelId ? levelLabel(rule.cycleLevelId) : undefined}
			onEdit={() =>
				DeliberationRuleFormDialog.call({ initial: toRuleForm(rule) })
			}
			onToggleActive={() =>
				setActive.mutate({ id: rule.id, isActive: !rule.isActive })
			}
			onDelete={() => confirmDelete({ id: rule.id, name: rule.name })}
		/>
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
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
				<Button onClick={() => DeliberationRuleFormDialog.call({})}>
					<Plus className="mr-2 h-4 w-4" />
					{t("admin.deliberations.rules.create")}
				</Button>
			</div>

			<DeliberationRulesHelp
				key={isLoading ? "loading" : "ready"}
				defaultOpen={!isLoading && rules.length === 0}
				onUseExample={(example) =>
					DeliberationRuleFormDialog.call({
						initial: exampleRuleForm(example, {
							name: t(
								`admin.deliberations.rules.help.examples.${example.key}.name`,
							),
							message: t(
								`admin.deliberations.rules.help.examples.${example.key}.message`,
							),
						}),
					})
				}
			/>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
				</div>
			) : rules.length === 0 ? (
				<Empty className="border border-dashed">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileCog className="text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>
							{t("admin.deliberations.rules.empty.title")}
						</EmptyTitle>
						<EmptyDescription>
							{t("admin.deliberations.rules.empty.description")}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="space-y-6">
					{groups.map((group) => (
						<div key={group.category}>
							<h2 className="mb-3 font-semibold text-foreground text-sm uppercase tracking-wide">
								{t(`admin.deliberations.rules.categories.${group.category}`)}
							</h2>
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{group.rules.map(renderCard)}
							</div>
						</div>
					))}

					{/* Rules of an unknown category */}
					{other.length > 0 && (
						<div>
							<h2 className="mb-3 font-semibold text-foreground text-sm uppercase tracking-wide">
								{t("admin.deliberations.rules.categories.other")}
							</h2>
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{other.map((rule) => (
									<div
										key={rule.id}
										className="rounded-xl border bg-card p-4 shadow-sm"
									>
										<p className="break-words font-medium text-sm">
											{rule.name}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
