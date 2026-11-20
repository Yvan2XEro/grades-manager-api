import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DeliberationRule } from "../services/deliberation-rules";
import { decisionVariants } from "../services/deliberation-status";
import { summarizeRuleset } from "../services/rule-conditions";

interface DeliberationRuleCardProps {
	rule: DeliberationRule;
	/** Names of the rule's scope (undefined = every program / level). */
	programLabel?: string;
	levelLabel?: string;
	onEdit: () => void;
	onToggleActive: () => void;
	onDelete: () => void;
}

export function DeliberationRuleCard({
	rule,
	programLabel,
	levelLabel,
	onEdit,
	onToggleActive,
	onDelete,
}: DeliberationRuleCardProps) {
	const { t } = useTranslation();
	const summary = summarizeRuleset(t, rule.ruleset);
	const scope = [
		rule.programId
			? (programLabel ?? t("admin.deliberations.rules.scope.unknownProgram"))
			: t("admin.deliberations.rules.scope.allPrograms"),
		rule.cycleLevelId
			? (levelLabel ?? t("admin.deliberations.rules.scope.unknownLevel"))
			: t("admin.deliberations.rules.scope.allLevels"),
		rule.deliberationType
			? t(`admin.deliberations.type.${rule.deliberationType}`)
			: t("admin.deliberations.rules.scope.allTypes"),
	];

	return (
		<div
			className={cn(
				"flex h-full flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
				!rule.isActive && "opacity-70",
			)}
		>
			<div className="flex items-start gap-2">
				<h3 className="min-w-0 flex-1 break-words font-medium text-sm">
					<button
						type="button"
						onClick={onEdit}
						className="text-left hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
					>
						{rule.name}
					</button>
				</h3>
				<Badge
					variant={rule.isActive ? "default" : "secondary"}
					className="shrink-0 text-[10px]"
				>
					{rule.isActive
						? t("admin.deliberations.rules.active")
						: t("admin.deliberations.rules.inactive")}
				</Badge>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="-mt-1 -mr-2 h-7 w-7 shrink-0"
							aria-label={t("common.table.actions")}
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={onEdit}>
							<Pencil className="h-4 w-4" />
							{t("common.actions.edit")}
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={onToggleActive}>
							{rule.isActive ? (
								<PowerOff className="h-4 w-4" />
							) : (
								<Power className="h-4 w-4" />
							)}
							{rule.isActive
								? t("admin.deliberations.rules.deactivate")
								: t("admin.deliberations.rules.activate")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={onDelete}>
							<Trash2 className="h-4 w-4" />
							{t("common.actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<p className="text-sm">
				{summary ? (
					<>
						<span className="text-muted-foreground">
							{t("admin.deliberations.rules.summary.if")}
						</span>{" "}
						{summary}
					</>
				) : (
					<span className="text-muted-foreground italic">
						{t("admin.deliberations.rules.summary.advanced")}
					</span>
				)}
			</p>

			{rule.description && rule.description !== summary && (
				<p className="line-clamp-3 break-words text-muted-foreground text-xs">
					{rule.description}
				</p>
			)}

			<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
				<Badge variant={decisionVariants[rule.decision] ?? "outline"}>
					{t(`admin.deliberations.decision.${rule.decision}`)}
				</Badge>
				<span
					className="text-muted-foreground text-xs"
					title={t("admin.deliberations.rules.priority")}
				>
					{t("admin.deliberations.rules.priorityShort", {
						value: rule.priority,
					})}
				</span>
			</div>
			<p className="break-words text-muted-foreground text-xs">
				{scope.join(" · ")}
			</p>
		</div>
	);
}
