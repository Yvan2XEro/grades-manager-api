import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** Page of exam types. */
export function useExamTypes() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const { data, isLoading } = useQuery(
		trpc.examTypes.listPaged.queryOptions({ page, pageSize }),
	);
	return {
		data,
		examTypes: data?.items ?? [],
		isLoading,
		page,
		setPage,
		pageSize,
		setPageSize: (size: number) => {
			setPageSize(size);
			setPage(1);
		},
	};
}

/** Delete / bulk delete of exam types. */
export function useDeleteExamTypes(onBulkDeleted: () => void) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const deleteExamType = useMutation({
		mutationFn: async (id: string) => {
			await trpcClient.examTypes.delete.mutate({ id });
		},
		onSuccess: () => {
			toast.success(t("admin.examTypes.toast.deleteSuccess"));
			queryClient.invalidateQueries(trpc.examTypes.listPaged.queryKey());
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("admin.examTypes.toast.deleteError");
			toast.error(message);
		},
	});

	const bulkDelete = useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(
				ids.map((id) => trpcClient.examTypes.delete.mutate({ id })),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries(trpc.examTypes.listPaged.queryKey());
			onBulkDeleted();
			toast.success(
				t("common.bulkActions.deleteSuccess", {
					defaultValue: "Items deleted successfully",
				}),
			);
		},
		onError: () =>
			toast.error(
				t("common.bulkActions.deleteError", {
					defaultValue: "Failed to delete items",
				}),
			),
	});

	return { deleteExamType, bulkDelete };
}
