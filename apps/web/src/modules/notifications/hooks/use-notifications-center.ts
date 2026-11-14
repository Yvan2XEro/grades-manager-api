import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Confirm } from "@/components/callable/confirm";
import { useRowSelection } from "@/hooks/useRowSelection";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { StatusFilter } from "../types";

/** Email deliveries (admin): status filter, page, stats and actions. */
export function useNotificationsCenter() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilterState] = useState<StatusFilter>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const setStatusFilter = (value: StatusFilter) => {
		setStatusFilterState(value);
		setPage(1);
	};

	const { data, isLoading } = useQuery(
		trpc.notifications.listPaged.queryOptions({
			page,
			pageSize,
			status: statusFilter === "all" ? undefined : statusFilter,
			channel: "email",
		}),
	);
	const notifications = data?.items ?? [];
	const selection = useRowSelection(notifications);

	const statsQuery = useQuery(trpc.notifications.stats.queryOptions());

	const invalidateList = () =>
		queryClient.invalidateQueries({
			queryKey: trpc.notifications.listPaged.queryKey(),
		});

	const ackMutation = useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.acknowledge.mutate({ id }),
		onSuccess: () => {
			invalidateList();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const retryMutation = useMutation({
		mutationFn: (id: string) => trpcClient.notifications.retry.mutate({ id }),
		onSuccess: () => {
			toast.success(
				t("admin.notifications.toast.retried", {
					defaultValue: "Notification requeued",
				}),
			);
			invalidateList();
			queryClient.invalidateQueries(trpc.notifications.stats.queryKey());
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
			invalidateList();
			selection.clear();
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const confirmFlush = () =>
		Confirm.call({
			title: t("admin.notifications.actions.flush", {
				defaultValue: "Flush pending",
			}),
			description: t("admin.notifications.flushConfirmDesc", {
				defaultValue:
					"This will immediately attempt delivery of all pending notifications. Continue?",
			}),
			confirmLabel: t("admin.notifications.actions.flush", {
				defaultValue: "Flush",
			}),
			cancelLabel: t("common.cancel"),
			destructive: false,
			mutationFn: async (call) => {
				try {
					await flushMutation.mutateAsync();
				} finally {
					call.end(true);
				}
			},
		});

	return {
		statusFilter,
		setStatusFilter,
		page,
		setPage,
		pageSize,
		setPageSize: (size: number) => {
			setPageSize(size);
			setPage(1);
		},
		data,
		isLoading,
		notifications,
		selection,
		stats: statsQuery.data,
		ackMutation,
		retryMutation,
		flushMutation,
		confirmFlush,
	};
}
