import { Inbox } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MyNotificationItem } from "../components/my-notification-item";
import { NotificationsToolbar } from "../components/notifications-toolbar";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useMyNotifications,
} from "../hooks/use-my-notifications";

/** `/notifications`: every notification of the current user. */
export default function NotificationsPage() {
	const { t } = useTranslation();
	const [unreadOnly, setUnreadOnly] = useState(false);
	const { listQuery, items: allItems, unread } = useMyNotifications(50);
	const items = unreadOnly ? allItems.filter((n) => !n.readAt) : allItems;
	const markReadMut = useMarkNotificationRead();
	const markAllMut = useMarkAllNotificationsRead();

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("notifications.page.title")}
				description={t("notifications.page.description")}
			/>

			<NotificationsToolbar
				unreadOnly={unreadOnly}
				onUnreadOnlyChange={setUnreadOnly}
				unread={unread}
				onMarkAllRead={() => markAllMut.mutate()}
				isMarkingAll={markAllMut.isPending}
			/>

			{listQuery.isPending ? (
				<div className="space-y-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-20 w-full rounded-xl" />
					))}
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
					<Inbox className="h-8 w-8 text-muted-foreground/40" />
					<p className="text-muted-foreground text-sm">
						{t("notifications.empty")}
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{items.map((item) => (
						<MyNotificationItem
							key={item.id}
							item={item}
							onMarkRead={(id) => markReadMut.mutate(id)}
							isMarkingRead={markReadMut.isPending}
						/>
					))}
				</div>
			)}
		</div>
	);
}
