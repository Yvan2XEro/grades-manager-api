import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeliberationRule } from "../services/deliberation-rules";

interface DeliberationRuleCardProps {
	rule: DeliberationRule;
	onEdit: () => void;
	onToggleActive: () => void;
	onDelete: () => void;
}

export function DeliberationRuleCard({
	rule,
	onEdit,
	onToggleActive,
	onDelete,
}: DeliberationRuleCardProps) {
	const { t } = useTranslation();
	return (
		<div className="group relative rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex items-start justify-between">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate font-medium text-sm">{rule.name}</h3>
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
						<DropdownMenuItem onClick={onEdit}>
							<Pencil className="mr-2 h-4 w-4" />
							{t("common.actions.edit")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onToggleActive}>
							<Power className="mr-2 h-4 w-4" />
							{rule.isActive
								? t("admin.deliberations.rules.inactive")
								: t("admin.deliberations.rules.active")}
						</DropdownMenuItem>
						<DropdownMenuItem className="text-destructive" onClick={onDelete}>
							<Trash2 className="mr-2 h-4 w-4" />
							{t("common.actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
