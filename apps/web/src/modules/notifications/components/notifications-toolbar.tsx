import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** All / unread toggle and "mark all as read". */
export function NotificationsToolbar({
	unreadOnly,
	onUnreadOnlyChange,
	unread,
	onMarkAllRead,
	isMarkingAll,
}: {
	unreadOnly: boolean;
	onUnreadOnlyChange: (value: boolean) => void;
	unread: number;
	onMarkAllRead: () => void;
	isMarkingAll: boolean;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-3">
			<div className="flex items-center gap-1 rounded-lg border bg-card p-1">
				<button
					type="button"
					onClick={() => onUnreadOnlyChange(false)}
					className={cn(
						"rounded-md px-3 py-1.5 text-sm transition-colors",
						!unreadOnly
							? "bg-primary font-medium text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("notifications.page.all")}
				</button>
				<button
					type="button"
					onClick={() => onUnreadOnlyChange(true)}
					className={cn(
						"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
						unreadOnly
							? "bg-primary font-medium text-primary-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t("notifications.page.unreadOnly")}
					{unread > 0 && (
						<Badge className="h-4 bg-primary/20 px-1.5 text-[10px] text-primary">
							{unread}
						</Badge>
					)}
				</button>
			</div>

			{unread > 0 && (
				<Button
					variant="outline"
					size="sm"
					onClick={onMarkAllRead}
					disabled={isMarkingAll}
				>
					{t("notifications.markAllRead")}
				</Button>
			)}
		</div>
	);
}
