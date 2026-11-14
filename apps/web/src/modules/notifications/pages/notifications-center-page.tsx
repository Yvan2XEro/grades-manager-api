import { Bell, Inbox, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";
import { NotificationDeliveryCard } from "../components/notification-delivery-card";
import { NotificationSelectionBar } from "../components/notification-selection-bar";
import { NotificationStatsBar } from "../components/notification-stats-bar";
import { NotificationStatusTabs } from "../components/notification-status-tabs";
import { useNotificationsCenter } from "../hooks/use-notifications-center";

/** Admin `/notifications/center`: email deliveries and their status. */
const NotificationsCenter = () => {
	const { t } = useTranslation();
	const c = useNotificationsCenter();
	const { selection } = c;

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
							{t("admin.notifications.title", {
								defaultValue: "Notifications",
							})}
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
					onClick={c.confirmFlush}
					disabled={c.flushMutation.isPending}
					className="gap-2"
				>
					<RefreshCw
						className={cn(
							"h-4 w-4",
							c.flushMutation.isPending && "animate-spin",
						)}
					/>
					{t("admin.notifications.actions.flush", {
						defaultValue: "Flush pending",
					})}
				</Button>
			</div>

			{c.stats && (
				<NotificationStatsBar stats={c.stats} onSelect={c.setStatusFilter} />
			)}

			<NotificationStatusTabs
				statusFilter={c.statusFilter}
				onChange={c.setStatusFilter}
				total={c.data?.total ?? 0}
			/>

			<NotificationSelectionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
				onFlush={c.confirmFlush}
				isFlushing={c.flushMutation.isPending}
			/>

			{/* Notification cards */}
			{c.isLoading ? (
				<div className="flex flex-col gap-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-24 animate-pulse rounded-xl border bg-muted"
						/>
					))}
				</div>
			) : c.notifications.length === 0 ? (
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
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							{t("admin.notifications.selectAll")}
						</span>
					</div>

					<div className="flex flex-col gap-2">
						{c.notifications.map((item) => (
							<NotificationDeliveryCard
								key={item.id}
								item={item}
								selected={selection.isSelected(item.id)}
								onToggle={() => selection.toggle(item.id)}
								onAcknowledge={() => c.ackMutation.mutate(item.id)}
								isAcknowledging={c.ackMutation.isPending}
								onRetry={() => c.retryMutation.mutate(item.id)}
								isRetrying={c.retryMutation.isPending}
							/>
						))}
					</div>
				</>
			)}

			<TablePagination
				page={c.page}
				pageCount={c.data?.pageCount ?? 1}
				total={c.data?.total ?? 0}
				pageSize={c.pageSize}
				onPageChange={c.setPage}
				onPageSizeChange={c.setPageSize}
			/>
		</div>
	);
};

export default NotificationsCenter;
