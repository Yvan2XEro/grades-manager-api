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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc, trpcClient } from "@/utils/trpc";

// ── Notification config (shared with NotificationBell) ────────────────────────

type TFn = (key: string, opts?: Record<string, unknown>) => string;

type NotifConfig = {
	icon: React.ReactNode;
	labelKey: string;
	subtitleFn?: (payload: Record<string, unknown>, t: TFn) => string;
	toFn?: (payload: Record<string, unknown>) => string | undefined;
};

const NOTIF_CONFIGS: Record<string, NotifConfig> = {
	"fee.payment_confirmed": {
		icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
		labelKey: "notifications.types.fee_payment_confirmed",
		subtitleFn: (p) =>
			p.amount && p.currency
				? `${Number(p.amount).toLocaleString()} ${p.currency}`
				: String(p.reference ?? ""),
	},
	"grade.approved": {
		icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
		labelKey: "notifications.types.grade_approved",
		subtitleFn: (p) => String(p.examName ?? ""),
		toFn: (p) =>
			p.classCourseId ? `/teacher/grades/${p.classCourseId}` : undefined,
	},
	"grade.rejected": {
		icon: <XCircle className="h-4 w-4 text-destructive" />,
		labelKey: "notifications.types.grade_rejected",
		subtitleFn: (p) => (p.reason ? String(p.reason) : String(p.examName ?? "")),
		toFn: (p) =>
			p.classCourseId ? `/teacher/grades/${p.classCourseId}` : undefined,
	},
	"deliberation.published": {
		icon: <GraduationCap className="h-4 w-4 text-violet-600" />,
		labelKey: "notifications.types.deliberation_published",
		toFn: () => "/student/performance",
	},
	"payment.pending": {
		icon: <CreditCard className="h-4 w-4 text-amber-500" />,
		labelKey: "notifications.types.payment_pending",
		toFn: () => "/student/fees",
	},
	"batch_job.completed": {
		icon: <ServerCog className="h-4 w-4 text-emerald-600" />,
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
		icon: <ServerCog className="h-4 w-4 text-destructive" />,
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
			icon: <Bell className="h-4 w-4 text-muted-foreground" />,
			labelKey: "notifications.types.generic",
		}
	);
}

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [unreadOnly, setUnreadOnly] = useState(false);

	const listQuery = useQuery(
		trpc.notifications.myNotifications.queryOptions({ limit: 50 }),
	);
	const countQuery = useQuery(trpc.notifications.unreadCount.queryOptions());
	const unread = countQuery.data ?? 0;

	const allItems = listQuery.data?.items ?? [];
	const items = unreadOnly ? allItems.filter((n) => !n.readAt) : allItems;

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
		<div className="space-y-6">
			<PageHeader
				title={t("notifications.page.title")}
				description={t("notifications.page.description")}
			/>

			{/* Toolbar */}
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1 rounded-lg border bg-card p-1">
					<button
						type="button"
						onClick={() => setUnreadOnly(false)}
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
						onClick={() => setUnreadOnly(true)}
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
						onClick={() => markAllMut.mutate()}
						disabled={markAllMut.isPending}
					>
						{t("notifications.markAllRead")}
					</Button>
				)}
			</div>

			{/* List */}
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
					{items.map((item) => {
						const isUnread = !item.readAt;
						const cfg = getConfig(item.type);
						const payload = (item.payload as Record<string, unknown>) ?? {};
						const subtitle = cfg.subtitleFn ? cfg.subtitleFn(payload, t) : "";
						const to = cfg.toFn ? cfg.toFn(payload) : undefined;

						const content = (
							<>
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
										isUnread
											? "border-primary/20 bg-primary/10"
											: "bg-muted/50",
									)}
								>
									{cfg.icon}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-semibold text-foreground text-sm">
											{t(cfg.labelKey as Parameters<typeof t>[0], {
												defaultValue: item.type
													.replace(/[._-]/g, " ")
													.replace(/\b\w/g, (c) => c.toUpperCase()),
											})}
										</p>
										{isUnread && (
											<span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
										)}
									</div>
									{subtitle && (
										<p className="mt-0.5 text-muted-foreground text-xs">
											{subtitle}
										</p>
									)}
									<p className="mt-1 text-muted-foreground/60 text-xs">
										{timeAgo(item.createdAt, t)}
									</p>
								</div>
							</>
						);

						return (
							<div
								key={item.id}
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
											if (isUnread) markReadMut.mutate(item.id);
										}}
									>
										{content}
									</Link>
								) : (
									<div className="flex min-w-0 flex-1 items-start gap-4">
										{content}
									</div>
								)}
								{isUnread && (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 shrink-0 self-center px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => markReadMut.mutate(item.id)}
										disabled={markReadMut.isPending}
									>
										{t("notifications.markRead")}
									</Button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
