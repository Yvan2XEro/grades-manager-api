import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Bell,
	CheckCircle2,
	Clock,
	Inbox,
	RefreshCw,
	XCircle,
	ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc, trpcClient } from "@/utils/trpc";

type NotifStatus = "pending" | "sent" | "failed";

const statusConfig: Record<
	NotifStatus,
	{ icon: React.ReactNode; className: string }
> = {
	pending: {
		icon: <Clock className="h-3.5 w-3.5" />,
		className: "bg-muted text-muted-foreground border-border",
	},
	sent: {
		icon: <CheckCircle2 className="h-3.5 w-3.5" />,
		className: "bg-primary/10 text-primary border-primary/20",
	},
	failed: {
		icon: <XCircle className="h-3.5 w-3.5" />,
		className: "bg-destructive/10 text-destructive border-destructive/20",
	},
};

function formatType(type: string) {
	return type
		.replace(/[_.-]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(date: string | Date, t: (k: string, o?: Record<string, unknown>) => string) {
	const diff = Date.now() - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return t("admin.notifications.timeAgo.justNow");
	if (mins < 60) return t("admin.notifications.timeAgo.minutes", { count: mins });
	const hours = Math.floor(mins / 60);
	if (hours < 24) return t("admin.notifications.timeAgo.hours", { count: hours });
	return t("admin.notifications.timeAgo.days", { count: Math.floor(hours / 24) });
}

export const NotificationBell: React.FC = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const pendingQuery = useQuery(
		trpc.notifications.list.queryOptions({ status: "pending", limit: 5 }),
	);
	const recentQuery = useQuery(
		trpc.notifications.list.queryOptions({ limit: 5 }),
	);

	const pendingCount = pendingQuery.data?.items.length ?? 0;
	const notifications = recentQuery.data?.items ?? [];

	const flushMutation = useMutation({
		mutationFn: () => trpcClient.notifications.flush.mutate(),
		onSuccess: () => {
			toast.success(t("admin.notifications.toast.flushed", { defaultValue: "Notifications envoyées" }));
			queryClient.invalidateQueries(trpc.notifications.list.queryKey());
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const ackMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.acknowledge.mutate({ id }),
		onSuccess: () =>
			queryClient.invalidateQueries(trpc.notifications.list.queryKey()),
		onError: (err: Error) => toast.error(err.message),
	});

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
							pendingCount > 0 && "animate-bell-shake",
						)}
					/>
					{pendingCount > 0 && (
						<span className="animate-badge-pop absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-semibold text-[10px] text-primary-foreground leading-none">
							{pendingCount > 9 ? "9+" : pendingCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				sideOffset={8}
				className="w-80 p-0 shadow-lg"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="flex items-center gap-2">
						<Inbox className="h-4 w-4 text-muted-foreground" />
						<span className="font-semibold text-sm">
							{t("admin.notifications.title", { defaultValue: "Notifications" })}
						</span>
						{pendingCount > 0 && (
							<Badge className="h-5 bg-primary px-1.5 text-[10px] text-primary-foreground">
								{t("admin.notifications.pendingBadge", { count: pendingCount })}
							</Badge>
						)}
					</div>
					{pendingCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 gap-1.5 px-2 text-xs"
							onClick={() => flushMutation.mutate()}
							disabled={flushMutation.isPending}
						>
							<RefreshCw className={cn("h-3 w-3", flushMutation.isPending && "animate-spin")} />
							Flush
						</Button>
					)}
				</div>

				{/* Notification list */}
				<div className="max-h-72 overflow-y-auto">
					{recentQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
							<Bell className="h-8 w-8 opacity-30" />
							<p className="text-xs">
								{t("admin.notifications.empty", { defaultValue: "Aucune notification" })}
							</p>
						</div>
					) : (
						<ul>
							{notifications.map((item) => {
								const s = statusConfig[item.status as NotifStatus];
								return (
									<li
										key={item.id}
										className="group flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/40 transition-colors"
									>
										<div
											className={cn(
												"mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
												s?.className,
											)}
										>
											{s?.icon}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-xs text-foreground">
												{formatType(item.type)}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{timeAgo(item.createdAt, t)}
												{item.channel && (
													<span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] uppercase tracking-wide">
														{item.channel}
													</span>
												)}
											</p>
										</div>
										{item.status === "pending" && (
											<button
												type="button"
												className="shrink-0 self-center rounded px-1.5 py-0.5 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
												onClick={() => ackMutation.mutate(item.id)}
											>
												{t("admin.notifications.actions.ack")}
											</button>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>

				{/* Footer */}
				<div className="border-t px-4 py-2.5">
					<Link
						to="/admin/notifications"
						className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium hover:underline"
					>
						{t("admin.notifications.viewAll")}
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>
			</PopoverContent>
		</Popover>
	);
};
