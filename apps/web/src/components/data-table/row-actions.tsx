import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLinkIcon } from "@/components/navigation/external-link-icon";
import { Button } from "@/components/ui/button";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** One action of a table row, shown in both its "…" menu and its right-click menu. */
export interface RowAction {
	label: string;
	icon?: LucideIcon;
	onSelect: () => void;
	destructive?: boolean;
	disabled?: boolean;
	/** Draws a separator above this action. */
	separator?: boolean;
	/** The action leaves the current page: shows an external-link icon. */
	external?: boolean;
}

export function RowActionsDropdown({ actions }: { actions: RowAction[] }) {
	const { t } = useTranslation();
	if (actions.length === 0) return null;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					aria-label={t("common.table.actions")}
				>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{actions.map(({ label, icon: Icon, ...action }) => (
					<Fragment key={label}>
						{action.separator && <DropdownMenuSeparator />}
						<DropdownMenuItem
							variant={action.destructive ? "destructive" : "default"}
							disabled={action.disabled}
							onSelect={action.onSelect}
						>
							{Icon && <Icon className="h-4 w-4" />}
							{label}
							{action.external && <ExternalLinkIcon className="ml-auto" />}
						</DropdownMenuItem>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function RowContextMenuItems({ actions }: { actions: RowAction[] }) {
	return (
		<>
			{actions.map(({ label, icon: Icon, ...action }) => (
				<Fragment key={label}>
					{action.separator && <ContextMenuSeparator />}
					<ContextMenuItem
						variant={action.destructive ? "destructive" : "default"}
						disabled={action.disabled}
						onSelect={action.onSelect}
					>
						{Icon && <Icon className="h-4 w-4" />}
						<span>{label}</span>
						{action.external && <ExternalLinkIcon className="ml-auto" />}
					</ContextMenuItem>
				</Fragment>
			))}
		</>
	);
}
