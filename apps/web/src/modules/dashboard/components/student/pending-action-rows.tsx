import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { NotifItem, TFn } from "../../types";

import { resolveNotifAction } from "./notification-actions";

/** Action item — requires user to do something (CTA button style). */
export function ActionRow({
	item,
	onMarkRead,
	isMarkingRead,
	t,
}: {
	item: NotifItem;
	onMarkRead: (id: string) => void;
	isMarkingRead: boolean;
	t: TFn;
}) {
	const { cfg, subtitle, to, label } = resolveNotifAction(item, t);

	return (
		<li className="flex items-center gap-3 bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white dark:border-amber-800 dark:bg-amber-950/50">
				{cfg?.icon ?? <Bell className="h-4 w-4 text-amber-500" />}
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-amber-900 text-xs dark:text-amber-200">
					{label}
				</p>
				{subtitle && (
					<p className="truncate text-[11px] text-amber-700 dark:text-amber-400">
						{subtitle}
					</p>
				)}
			</div>
			{to ? (
				<Button
					variant="default"
					size="sm"
					className="h-7 shrink-0 bg-amber-600 px-3 text-white text-xs hover:bg-amber-700"
					asChild
					onClick={() => onMarkRead(item.id)}
				>
					<Link to={to}>
						{t("student.pendingActions.act")}
						<ChevronRight className="ml-1 h-3 w-3" />
					</Link>
				</Button>
			) : (
				<button
					type="button"
					className="shrink-0 text-[10px] text-amber-600 hover:underline"
					onClick={() => onMarkRead(item.id)}
					disabled={isMarkingRead}
				>
					{t("notifications.markRead")}
				</button>
			)}
		</li>
	);
}

/** Info item — informational only, no required action. */
export function InfoRow({
	item,
	onMarkRead,
	isMarkingRead,
	t,
}: {
	item: NotifItem;
	onMarkRead: (id: string) => void;
	isMarkingRead: boolean;
	t: TFn;
}) {
	const { cfg, subtitle, to, label } = resolveNotifAction(item, t);

	const inner = (
		<div className="flex min-w-0 flex-1 items-center gap-2.5">
			<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
				{cfg?.icon ?? <Bell className="h-3.5 w-3.5 text-muted-foreground" />}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-foreground text-xs">{label}</p>
				{subtitle && (
					<p className="truncate text-[10px] text-muted-foreground">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);

	return (
		<li className="group flex items-center gap-2 px-4 py-2">
			{to ? (
				<Link
					to={to}
					className="min-w-0 flex-1"
					onClick={() => onMarkRead(item.id)}
				>
					{inner}
				</Link>
			) : (
				<div className="min-w-0 flex-1">{inner}</div>
			)}
			<button
				type="button"
				className="shrink-0 rounded px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground opacity-0 transition-opacity hover:underline group-hover:opacity-100"
				onClick={() => onMarkRead(item.id)}
				disabled={isMarkingRead}
			>
				{t("notifications.markRead")}
			</button>
		</li>
	);
}
