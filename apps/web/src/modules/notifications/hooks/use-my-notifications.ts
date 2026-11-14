import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";

/** Notifications of the current user and their unread count. */
export function useMyNotifications(limit: number) {
	const listQuery = useQuery(
		trpc.notifications.myNotifications.queryOptions({ limit }),
	);
	const countQuery = useQuery(trpc.notifications.unreadCount.queryOptions());
	return {
		listQuery,
		items: listQuery.data?.items ?? [],
		unread: countQuery.data ?? 0,
	};
}

function useInvalidateMyNotifications() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries(
			trpc.notifications.myNotifications.queryKey(),
		);
		queryClient.invalidateQueries(trpc.notifications.unreadCount.queryKey());
	};
}

export function useMarkNotificationRead() {
	const invalidate = useInvalidateMyNotifications();
	return useMutation({
		mutationFn: (id: string) =>
			trpcClient.notifications.markRead.mutate({ id }),
		onSuccess: invalidate,
	});
}

export function useMarkAllNotificationsRead() {
	const invalidate = useInvalidateMyNotifications();
	return useMutation({
		mutationFn: () => trpcClient.notifications.markAllRead.mutate(),
		onSuccess: invalidate,
	});
}
