import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Bell,
	CheckCircle2,
	CreditCard,
	GraduationCap,
	Inbox,
	ServerCog,
	XCircle,
} from "lucide-react";
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
import { trpc, trpcClient } from "@/utils/trpc";

// ─── Type → display config ────────────────────────────────────────────────────

type TFn = (key: string, opts?: Record<string, unknown>) => string;

type NotifConfig = {
	icon: React.ReactNode;
	labelKey: string;
	subtitleFn?: (payload: Record<string, unknown>, t: TFn) => string;
	toFn?: (payload: Record<string, unknown>) => string | undefined;
};

const NOTIF_CONFIGS: Record<string, NotifConfig> = {
	"fee.payment_confirmed": {
		icon: <CreditCard className="h-3.5 w-3.5 text-emerald-600" />,
		labelKey: "notifications.types.fee_payment_confirmed",
		subtitleFn: (p) =>
			p.amount && p.currency
				? `${Number(p.amount).toLocaleString()} ${p.currency}`
				: String(p.reference ?? ""),
	},
	"grade.approved": {
		icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
		labelKey: "notifications.types.grade_approved",
		subtitleFn: (p) => String(p.examName ?? ""),
		toFn: (p) =>
			p.classCourseId ? `/teacher/grades/${p.classCourseId}` : undefined,
	},
	"grade.rejected": {
		icon: <XCircle className="h-3.5 w-3.5 text-destructive" />,
		labelKey: "notifications.types.grade_rejected",
		subtitleFn: (p) => (p.reason ? String(p.reason) : String(p.examName ?? "")),
		toFn: (p) =>
			p.classCourseId ? `/teacher/grades/${p.classCourseId}` : undefined,
	},
	"deliberation.published": {
		icon: <GraduationCap className="h-3.5 w-3.5 text-violet-600" />,
		labelKey: "notifications.types.deliberation_published",
		toFn: () => "/student/performance",
	},
	"payment.pending": {
		icon: <CreditCard className="h-3.5 w-3.5 text-amber-500" />,
		labelKey: "notifications.types.payment_pending",
		toFn: () => "/student/fees",
	},
	"batch_job.completed": {
		icon: <ServerCog className="h-3.5 w-3.5 text-emerald-600" />,
		labelKey: "notifications.types.batch_job_completed",
		subtitleFn: (p, t) => {
			const jobType = p.jobType
				? t(`admin.batchJobs.types.${p.jobType}`, {
						defaultValue: String(p.jobType),
					})
				: "";
			return t("notifications.batchJob.completedSubtitle", {
				jobType,
				itemsProcessed: p.itemsProcessed ?? 0,
			});
		},
		toFn: (p) => (p.jobId ? `/admin/batch-jobs/${p.jobId}` : undefined),
	},
	"batch_job.failed": {
		icon: <ServerCog className="h-3.5 w-3.5 text-destructive" />,
		labelKey: "notifications.types.batch_job_failed",
		subtitleFn: (p, t) => {
			const jobType = p.jobType
				? t(`admin.batchJobs.types.${p.jobType}`, {
						defaultValue: String(p.jobType),
					})
				: "";
			return t("notifications.batchJob.failedSubtitle", {
				jobType,
				error: p.error ? String(p.error) : "",
			});
		},
		toFn: (p) => (p.jobId ? `/admin/batch-jobs/${p.jobId}` : undefined),
	},
};

function getConfig(type: string): NotifConfig {
	return (
		NOTIF_CONFIGS[type] ?? {
			icon: <Bell className="h-3.5 w-3.5 text-muted-foreground" />,
			labelKey: "notifications.types.generic",
		}
	);
}

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(
	date: string | Date,
	t: (k: string, o?: Record<string, unknown>) => string,
) {
	const diff = Date.now() - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return t("notifications.timeAgo.justNow");
	if (mins < 60) return t("notifications.timeAgo.minutes", { count: mins });
	const hours = Math.floor(mins / 60);
	if (hours < 24) return t("notifications.timeAgo.hours", { count: hours });
	return t("notifications.timeAgo.days", { count: Math.floor(hours / 24) });
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

export const NotificationBell: React.FC = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const countQuery = useQuery(trpc.notifications.unreadCount.queryOptions());
	const listQuery = useQuery(
		trpc.notifications.myNotifications.queryOptions({ limit: 20 }),
	);

	const unread = countQuery.data ?? 0;
	const items = listQuery.data?.items ?? [];

	const markReadMut = useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.markRead.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.notifications.myNotifications.queryKey(),
			);
			queryClient.invalidateQueries(trpc.notifications.unreadCount.queryKey());
		},
	});

	const markAllMut = useMutation({
		mutationFn: () => trpcClient.notifications.markAllRead.mutate(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.notifications.myNotifications.queryKey(),
			);
			queryClient.invalidateQueries(trpc.notifications.unreadCount.queryKey());
		},
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
								const cfg = getConfig(item.type);
								const payload = (item.payload as Record<string, unknown>) ?? {};
								const subtitle = cfg.subtitleFn
									? cfg.subtitleFn(payload, t)
									: "";
								const to = cfg.toFn ? cfg.toFn(payload) : undefined;

								const innerContent = (
									<>
										<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
											{cfg.icon}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<p className="truncate font-medium text-foreground text-xs">
													{t(cfg.labelKey, {
														defaultValue: item.type
															.replace(/[._-]/g, " ")
															.replace(/\b\w/g, (c) => c.toUpperCase()),
													})}
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
												{timeAgo(item.createdAt, t)}
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
