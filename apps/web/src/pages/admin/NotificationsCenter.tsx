import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRowSelection } from "@/hooks/useRowSelection";
import { trpc, trpcClient } from "../../utils/trpc";

const NotificationsCenter = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const pagination = useCursorPagination({ pageSize: 20 });

	const notificationsQuery = useQuery(
		trpc.notifications.list.queryOptions({
			cursor: pagination.cursor,
			limit: pagination.pageSize,
		}),
	);

	const notifications = notificationsQuery.data?.items ?? [];
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
			<div className="flex items-center space-x-3">
				<Bell className="h-6 w-6 text-primary-700" />
				<div>
					<h1 className="font-bold font-heading text-2xl text-foreground">
						{t("admin.notifications.title")}
					</h1>
					<p className="text-muted-foreground">
						{t("admin.notifications.subtitle")}
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-foreground text-lg">
					{t("admin.notifications.queueTitle", {
						defaultValue: "Latest notifications",
					})}
				</h2>
				<button
					type="button"
					onClick={() => flushMutation.mutate()}
					className="flex items-center rounded-lg border px-3 py-2 font-medium text-foreground text-sm"
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{t("admin.notifications.actions.flush", {
						defaultValue: "Flush pending",
					})}
				</button>
			</div>

			<BulkActionBar
				selectedCount={selection.selectedCount}
				onClear={selection.clear}
			>
				<Button
					variant="outline"
					size="sm"
					onClick={() => flushMutation.mutate()}
					disabled={flushMutation.isPending}
				>
					<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
					{t("admin.notifications.actions.flush", {
						defaultValue: "Flush pending",
					})}
				</Button>
			</BulkActionBar>

			<div className="rounded-xl border bg-card p-6 shadow-sm">
				{notificationsQuery.isLoading ? (
					<p className="text-muted-foreground text-sm">
						{t("common.loading", { defaultValue: "Loading..." })}
					</p>
				) : notifications.length ? (
					<>
						<div className="mb-4 flex items-center border-border border-b pb-3">
							<Checkbox
								checked={selection.isAllSelected}
								onCheckedChange={(checked) => selection.toggleAll(!!checked)}
								aria-label="Select all"
							/>
							<span className="ml-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
								{t("admin.notifications.selectAll", {
									defaultValue: "Select all",
								})}
							</span>
						</div>
						{notifications.map((item) => (
							<div
								key={item.id}
								className="flex items-start justify-between border-border border-b py-4 last:border-0"
							>
								<div className="flex items-start space-x-3">
									<Checkbox
										checked={selection.isSelected(item.id)}
										onCheckedChange={() => selection.toggle(item.id)}
										aria-label={`Select notification ${item.type}`}
										className="mt-2"
									/>
									<div
										className={`rounded-full p-2 ${
											item.status === "sent"
												? "bg-emerald-100 text-emerald-700"
												: "bg-blue-100 text-blue-700"
										}`}
									>
										{item.status === "sent" ? (
											<CheckCircle2 className="h-5 w-5" />
										) : (
											<Inbox className="h-5 w-5" />
										)}
									</div>
									<div>
										<p className="font-medium text-foreground">{item.type}</p>
										<p className="text-muted-foreground text-sm">
											{JSON.stringify(item.payload)}
										</p>
									</div>
								</div>
								<button
									type="button"
									className="font-medium text-primary-700 text-xs"
									onClick={() => ackMutation.mutate(item.id)}
									disabled={item.status === "sent"}
								>
									{t("admin.notifications.actions.ack", {
										defaultValue: "Acknowledge",
									})}
								</button>
							</div>
						))}
					</>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("admin.notifications.empty", {
							defaultValue: "No notifications yet.",
						})}
					</p>
				)}
			</div>

			<PaginationBar
				hasPrev={pagination.hasPrev}
				hasNext={!!notificationsQuery.data?.nextCursor}
				onPrev={pagination.handlePrev}
				onNext={() =>
					pagination.handleNext(notificationsQuery.data?.nextCursor)
				}
				isLoading={notificationsQuery.isLoading}
			/>
		</div>
	);
};

export default NotificationsCenter;
