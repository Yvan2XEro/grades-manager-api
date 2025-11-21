import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient } from "../../utils/trpc";

const NotificationsCenter = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const notificationsQuery = useQuery(
		trpc.notifications.list.queryOptions({}),
	);

	const ackMutation = useMutation({
		mutationFn: (id: string) => trpcClient.notifications.acknowledge.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.notifications.list.queryKey({}));
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const flushMutation = useMutation({
		mutationFn: () => trpcClient.notifications.flush.mutate(),
		onSuccess: () => {
			toast.success(t("admin.notifications.toast.flushed", { defaultValue: "Pending notifications flushed" }));
			queryClient.invalidateQueries(trpc.notifications.list.queryKey({}));
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const notifications = notificationsQuery.data ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-3">
				<Bell className="h-6 w-6 text-primary-700" />
				<div>
					<h1 className="font-semibold text-2xl text-gray-900">
						{t("admin.notifications.title")}
					</h1>
					<p className="text-gray-600">{t("admin.notifications.subtitle")}</p>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900">
					{t("admin.notifications.queueTitle", { defaultValue: "Latest notifications" })}
				</h2>
				<button
					type="button"
					onClick={() => flushMutation.mutate()}
					className="flex items-center rounded-lg border px-3 py-2 text-sm font-medium text-gray-700"
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{t("admin.notifications.actions.flush", { defaultValue: "Flush pending" })}
				</button>
			</div>

			<div className="rounded-xl border bg-white p-6 shadow-sm">
				{notificationsQuery.isLoading ? (
					<p className="text-sm text-gray-500">
						{t("common.loading", { defaultValue: "Loading..." })}
					</p>
				) : notifications.length ? (
					notifications.map((item) => (
						<div
							key={item.id}
							className="flex items-start justify-between border-gray-100 border-b py-4 last:border-0"
						>
							<div className="flex items-start space-x-3">
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
									<p className="font-medium text-gray-900">
										{item.type}
									</p>
									<p className="text-gray-600 text-sm">
										{JSON.stringify(item.payload)}
									</p>
								</div>
							</div>
							<button
								type="button"
								className="text-xs font-medium text-primary-700"
								onClick={() => ackMutation.mutate(item.id)}
								disabled={item.status === "sent"}
							>
								{t("admin.notifications.actions.ack", { defaultValue: "Acknowledge" })}
							</button>
						</div>
					))
				) : (
					<p className="text-sm text-gray-500">
						{t("admin.notifications.empty", { defaultValue: "No notifications yet." })}
					</p>
				)}
			</div>
		</div>
	);
};

export default NotificationsCenter;
