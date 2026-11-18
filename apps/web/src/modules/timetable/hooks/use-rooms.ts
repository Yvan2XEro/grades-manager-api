import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Every room of the institution. */
export function useRooms() {
	const query = useQuery(trpc.rooms.list.queryOptions({}));
	return { ...query, rooms: query.data ?? [] };
}

function useInvalidateRooms() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries(trpc.rooms.list.queryFilter({}));
}

/** Activates or deactivates a room. */
export function useToggleRoomActive() {
	const invalidate = useInvalidateRooms();
	return useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.rooms.update.mutate({ id, isActive }),
		onSuccess: () => invalidate(),
		onError: (e) => toast.error(e.message),
	});
}

/** Deletes a room. */
export function useDeleteRoom() {
	const { t } = useTranslation();
	const invalidate = useInvalidateRooms();
	return useMutation({
		mutationFn: (id: string) => trpcClient.rooms.delete.mutate({ id }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			invalidate();
		},
		onError: (e) => toast.error(e.message),
	});
}
