import { Bell, Inbox } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useMyNotifications,
} from "@/modules/notifications/hooks/use-my-notifications";
import {
	resolveNotification,
	type TFn,
	timeAgo,
} from "@/modules/notifications/services/notification-types";

// ─── NotificationBell ─────────────────────────────────────────────────────────

export const NotificationBell: React.FC = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const { listQuery, items, unread } = useMyNotifications(20);
	const markReadMut = useMarkNotificationRead();
	const markAllMut = useMarkAllNotificationsRead();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
					aria-label={t("navigation.header.notificationsAria")}
				>
					<Bell
						className={cn(
							"h-[18px] w-[18px] transition-transform",
							unread > 0 && "animate-bell-shake",
						)}
					/>
					{unread > 0 && (
						<span className="absolute top-1 right-1 flex h-4 w-4 animate-badge-pop items-center justify-center rounded-full bg-primary font-semibold text-[10px] text-primary-foreground leading-none">
							{unread > 9 ? "9+" : unread}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-lg">
				{/* Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="flex items-center gap-2">
						<Inbox className="h-4 w-4 text-muted-foreground" />
						<span className="font-semibold text-sm">
							{t("notifications.title")}
						</span>
						{unread > 0 && (
							<Badge className="h-5 bg-primary px-1.5 text-[10px] text-primary-foreground">
								{unread}
							</Badge>
						)}
					</div>
					{unread > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={() => markAllMut.mutate()}
							disabled={markAllMut.isPending}
						>
							{t("notifications.markAllRead")}
						</Button>
					)}
				</div>

				{/* List */}
				<div className="max-h-80 overflow-y-auto">
					{listQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Bell className="h-4 w-4 animate-pulse text-muted-foreground" />
						</div>
					) : items.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
							<Bell className="h-8 w-8 opacity-30" />
							<p className="text-xs">{t("notifications.empty")}</p>
						</div>
					) : (
						<ul>
							{items.map((item) => {
								const isUnread = !item.readAt;
								const { icon, label, subtitle, to } = resolveNotification(
									item,
									t as unknown as TFn,
									"h-3.5 w-3.5",
								);

								const innerContent = (
									<>
										<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
											{icon}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<p className="truncate font-medium text-foreground text-xs">
													{label}
												</p>
												{isUnread && (
													<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
												)}
											</div>
											{subtitle && (
												<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
													{subtitle}
												</p>
											)}
											<p className="mt-0.5 text-[10px] text-muted-foreground/70">
												{timeAgo(item.createdAt, t as unknown as TFn)}
											</p>
										</div>
									</>
								);

								return (
									<li
										key={item.id}
										className={cn(
											"group flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/40",
											isUnread && "bg-primary/3",
										)}
									>
										{to ? (
											<Link
												to={to}
												className="flex min-w-0 flex-1 items-start gap-3"
												onClick={() => {
													if (isUnread) markReadMut.mutate(item.id);
												}}
											>
												{innerContent}
											</Link>
										) : (
											<div className="flex min-w-0 flex-1 items-start gap-3">
												{innerContent}
											</div>
										)}
										{isUnread && (
											<button
												type="button"
												className="shrink-0 self-center rounded px-1.5 py-0.5 font-medium text-[10px] text-primary opacity-0 transition-opacity hover:underline group-hover:opacity-100"
												onClick={() => markReadMut.mutate(item.id)}
												disabled={markReadMut.isPending}
											>
												{t("notifications.markRead")}
											</button>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>

				{/* Footer — view all */}
				<div className="border-t px-4 py-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 w-full text-xs"
						onClick={() => navigate("/notifications")}
					>
						{t("notifications.viewAll")}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
