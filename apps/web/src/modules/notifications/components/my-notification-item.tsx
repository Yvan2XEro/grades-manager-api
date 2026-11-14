import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	resolveNotification,
	type TFn,
	timeAgo,
} from "../services/notification-types";
import type { MyNotification } from "../types";

/** One notification of the current user (link + "mark as read"). */
export function MyNotificationItem({
	item,
	onMarkRead,
	isMarkingRead,
}: {
	item: MyNotification;
	onMarkRead: (id: string) => void;
	isMarkingRead: boolean;
}) {
	const { t: translate } = useTranslation();
	const t = translate as unknown as TFn;
	const isUnread = !item.readAt;
	const { icon, label, subtitle, to } = resolveNotification(item, t, "h-4 w-4");

	const content = (
		<>
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
					isUnread ? "border-primary/20 bg-primary/10" : "bg-muted/50",
				)}
			>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-foreground text-sm">{label}</p>
					{isUnread && (
						<span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
					)}
				</div>
				{subtitle && (
					<p className="mt-0.5 text-muted-foreground text-xs">{subtitle}</p>
				)}
				<p className="mt-1 text-muted-foreground/60 text-xs">
					{timeAgo(item.createdAt, t)}
				</p>
			</div>
		</>
	);

	return (
		<div
			className={cn(
				"group flex items-start gap-4 rounded-xl border px-4 py-3.5 transition-colors",
				isUnread
					? "border-primary/20 bg-primary/[0.03]"
					: "border-border bg-card",
			)}
		>
			{to ? (
				<Link
					to={to}
					className="flex min-w-0 flex-1 items-start gap-4"
					onClick={() => {
						if (isUnread) onMarkRead(item.id);
					}}
				>
					{content}
				</Link>
			) : (
				<div className="flex min-w-0 flex-1 items-start gap-4">{content}</div>
			)}
			{isUnread && (
				<Button
					variant="ghost"
					size="sm"
					className="h-7 shrink-0 self-center px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
					onClick={() => onMarkRead(item.id)}
					disabled={isMarkingRead}
				>
					{t("notifications.markRead")}
				</Button>
			)}
		</div>
	);
}
