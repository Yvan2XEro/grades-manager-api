import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const listInput = { includeInactive: true };

/** Every registration number format, active or not. */
export function useRegistrationFormats(options?: { enabled?: boolean }) {
	return useQuery({
		...trpc.registrationNumbers.list.queryOptions(listInput),
		enabled: options?.enabled ?? true,
	});
}

export function useInvalidateRegistrationFormats() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries(
			trpc.registrationNumbers.list.queryKey(listInput),
		);
}

/** Makes a format the active one (the server deactivates the others). */
export function useActivateRegistrationFormat() {
	const { t } = useTranslation();
	const invalidate = useInvalidateRegistrationFormats();
	return useMutation({
		mutationFn: (id: string) =>
			trpcClient.registrationNumbers.update.mutate({ id, isActive: true }),
		onSuccess: () => {
			toast.success(
				t("admin.registrationNumbers.toast.activated", {
					defaultValue: "Format activated",
				}),
			);
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});
}

/** Deletes one or several formats and refreshes the list. */
export function useDeleteRegistrationFormats() {
	const { t } = useTranslation();
	const invalidate = useInvalidateRegistrationFormats();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.registrationNumbers.delete.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			invalidate();
			toast.success(
				ids.length === 1
					? t("admin.registrationNumbers.toast.deleted", {
							defaultValue: "Format deleted",
						})
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? error.message
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			),
	});
}
