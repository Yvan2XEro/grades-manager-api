import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Fragment } from "react";
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
}

export function RowActionsDropdown({ actions }: { actions: RowAction[] }) {
	if (actions.length === 0) return null;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					aria-label="Actions"
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
					</ContextMenuItem>
				</Fragment>
			))}
		</>
	);
}
