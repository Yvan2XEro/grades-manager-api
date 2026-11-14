import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ProgramListItem } from "../types";

/** One page of courses. */
export function useCourses({
	page,
	pageSize,
}: {
	page: number;
	pageSize: number;
}) {
	const query = useQuery(
		trpc.courses.listPaged.queryOptions({ page, pageSize }),
	);
	return { ...query, courses: query.data?.items ?? [] };
}

/** Program names by id, for the courses table. */
export function useCourseProgramNames() {
	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { items } = await trpcClient.programs.list.query({ limit: 100 });
			return items as ProgramListItem[];
		},
	});
	return useMemo(
		() =>
			new Map((programs ?? []).map((program) => [program.id, program.name])),
		[programs],
	);
}

/** Deletes one or several courses and refreshes the list. */
export function useDeleteCourses() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(ids.map((id) => trpcClient.courses.delete.mutate({ id }))),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries(trpc.courses.listPaged.queryKey());
			toast.success(
				ids.length === 1
					? t("admin.courses.toast.deleteSuccess")
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? (error as Error).message || t("admin.courses.toast.deleteError")
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			),
	});
}
