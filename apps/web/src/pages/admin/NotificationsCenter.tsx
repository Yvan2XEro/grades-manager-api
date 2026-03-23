import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Bell,
	CheckCircle2,
	Clock,
	Filter,
	Inbox,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useRowSelection } from "@/hooks/useRowSelection";
import { cn } from "@/lib/utils";
import { trpc, trpcClient } from "../../utils/trpc";

type StatusFilter = "all" | "pending" | "sent" | "failed";

const STATUS_TABS: { key: StatusFilter }[] = [
	{ key: "all", label: "Tout" },
	{ key: "pending", label: "En attente" },
	{ key: "sent", label: "Envoyées" },
	{ key: "failed", label: "Échouées" },
];

const statusConfig = {
	pending: {
		icon: <Clock className="h-4 w-4" />,
		labelKey: "admin.notifications.status.pending",
		badge: "bg-muted text-foreground border-border",
		dot: "bg-muted-foreground",
	},
	sent: {
		icon: <CheckCircle2 className="h-4 w-4" />,
		labelKey: "admin.notifications.status.sent",
		badge: "bg-primary/10 text-primary border-primary/20",
		dot: "bg-primary",
	},
	failed: {
		icon: <XCircle className="h-4 w-4" />,
		labelKey: "admin.notifications.status.failed",
		badge: "bg-destructive/10 text-destructive border-destructive/20",
		dot: "bg-destructive",
	},
} as const;

const channelLabels: Record<string, string> = {
	email: "Email",
	webhook: "Webhook",
};

function formatType(type: string) {
	return type
		.replace(/[_.-]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: string | Date) {
	return new Intl.DateTimeFormat("fr-FR", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

function PayloadPreview({ payload }: { payload: unknown }) {
	const entries = Object.entries(payload as Record<string, unknown>).slice(0, 4);
	if (entries.length === 0) return null;
	return (
		<dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
			{entries.map(([key, val]) => (
				<div key={key} className="flex flex-col">
					<dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{key}
					</dt>
					<dd className="truncate text-xs text-foreground">
						{typeof val === "object" ? JSON.stringify(val) : String(val)}
					</dd>
				</div>
			))}
		</dl>
	);
}

const NotificationsCenter = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	const notificationsQuery = useInfiniteQuery({
		queryKey: trpc.notifications.list.queryKey({ status: statusFilter === "all" ? undefined : statusFilter }),
		queryFn: async ({ pageParam }) => {
			return trpcClient.notifications.list.query({
				status: statusFilter === "all" ? undefined : statusFilter,
				cursor: pageParam,
				limit: 20,
			});
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	const notifications = notificationsQuery.data?.pages.flatMap((p) => p.items) ?? [];
	const sentinelRef = useInfiniteScroll(notificationsQuery.fetchNextPage, { enabled: notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage });
	const selection = useRowSelection(notifications);

	const ackMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.acknowledge.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.notifications.list.queryKey());
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const flushMutation = useMutation({
		mutationFn: () => trpcClient.notifications.flush.mutate(),
		onSuccess: () => {
			toast.success(
				t("admin.notifications.toast.flushed", {
					defaultValue: "Pending notifications flushed",
				}),
			);
			queryClient.invalidateQueries(trpc.notifications.list.queryKey());
			selection.clear();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Bell className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="font-semibold text-foreground text-xl">
							{t("admin.notifications.title", { defaultValue: "Notifications" })}
						</h1>
						<p className="text-muted-foreground text-sm">
							{t("admin.notifications.subtitle", {
								defaultValue: "Suivi des notifications système",
							})}
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => flushMutation.mutate()}
					disabled={flushMutation.isPending}
					className="gap-2"
				>
					<RefreshCw
						className={cn("h-4 w-4", flushMutation.isPending && "animate-spin")}
					/>
					{t("admin.notifications.actions.flush", {
						defaultValue: "Flush pending",
					})}
				</Button>
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-1 border-b">
				{STATUS_TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => {
							setStatusFilter(tab.key);
						}}
						className={cn(
							"relative px-4 py-2.5 text-sm font-medium transition-colors",
							statusFilter === tab.key
								? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.label}
					</button>
				))}

				<div className="ml-auto flex items-center gap-2 pb-1">
					<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
						<Filter className="h-3.5 w-3.5" />
						{t("admin.notifications.results", { count: notifications.length })}
					</span>
				</div>
			</div>

			{/* Selection bar */}
			{selection.selectedCount > 0 && (
				<div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
					<span className="text-sm font-medium">
						{t("admin.notifications.selected", { count: selection.selectedCount })}
					</span>
					<div className="ml-auto flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={selection.clear}
							className="h-7 text-xs"
						>
							{t("admin.notifications.deselect")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => flushMutation.mutate()}
							disabled={flushMutation.isPending}
							className="h-7 gap-1.5 text-xs"
						>
							<RefreshCw className="h-3.5 w-3.5" />
							Flush
						</Button>
					</div>
				</div>
			)}

			{/* Notification cards */}
			{notificationsQuery.isLoading ? (
				<div className="flex flex-col gap-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-24 animate-pulse rounded-xl border bg-muted"
						/>
					))}
				</div>
			) : notifications.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card py-16 text-muted-foreground">
					<Inbox className="h-10 w-10 opacity-30" />
					<p className="text-sm">
						{t("admin.notifications.empty", {
							defaultValue: "Aucune notification",
						})}
					</p>
				</div>
			) : (
				<>
					{/* Select all */}
					<div className="flex items-center gap-3 px-1">
						<Checkbox
							checked={selection.isAllSelected}
							onCheckedChange={(checked) => selection.toggleAll(!!checked)}
							aria-label={t("admin.notifications.selectAll")}
						/>
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							{t("admin.notifications.selectAll")}
						</span>
					</div>

					<div className="flex flex-col gap-2">
						{notifications.map((item) => {
							const s = statusConfig[item.status as keyof typeof statusConfig];
							return (
								<div
									key={item.id}
									className={cn(
										"group relative flex items-start gap-4 rounded-xl border bg-card px-5 py-4 transition-shadow hover:shadow-sm",
										selection.isSelected(item.id) && "border-primary/40 bg-primary/5",
									)}
								>
									{/* Select */}
									<Checkbox
										checked={selection.isSelected(item.id)}
										onCheckedChange={() => selection.toggle(item.id)}
										aria-label={item.type}
										className="mt-1"
									/>

									{/* Status icon */}
									<div
										className={cn(
											"flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
											s?.badge,
										)}
									>
										{s?.icon}
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-semibold text-foreground text-sm">
												{formatType(item.type)}
											</p>
											{s && (
												<span
													className={cn(
														"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
														s.badge,
													)}
												>
													<span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
													{t(s.labelKey)}
												</span>
											)}
											{item.channel && (
												<span className="rounded border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
													{channelLabels[item.channel] ?? item.channel}
												</span>
											)}
										</div>

										<p className="mt-0.5 text-xs text-muted-foreground">
											{formatDate(item.createdAt)}
										</p>

										{item.payload &&
											typeof item.payload === "object" &&
											Object.keys(item.payload).length > 0 && (
												<PayloadPreview payload={item.payload} />
											)}
									</div>

									{/* Acknowledge */}
									{item.status === "pending" && (
										<Button
											variant="ghost"
											size="sm"
											className="h-7 shrink-0 self-start text-xs opacity-0 transition-opacity group-hover:opacity-100"
											onClick={() => ackMutation.mutate(item.id)}
											disabled={ackMutation.isPending}
										>
											<CheckCircle2 className="mr-1 h-3.5 w-3.5" />
											{t("admin.notifications.actions.ack", {
												defaultValue: "Accuser réception",
											})}
										</Button>
									)}
								</div>
							);
						})}
					</div>
				</>
			)}

			<div ref={sentinelRef} className="h-1" />
		</div>
	);
};

export default NotificationsCenter;
