import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ClassListItem, ClassRow } from "../types";

const ref = (
	item?: {
		id?: string | null;
		name?: string | null;
		code?: string | null;
	} | null,
) =>
	item?.id
		? { id: item.id, name: item.name ?? "", code: item.code ?? "" }
		: undefined;

export const toClassRow = (c: ClassListItem): ClassRow => ({
	id: c.id,
	code: c.code,
	name: c.name,
	totalCredits: c.totalCredits ?? 0,
	assignedCredits: c.assignedCredits ?? 0,
	studentCount: c.studentCount ?? 0,
	program: { name: c.programInfo?.name ?? "", code: c.programInfo?.code ?? "" },
	academicYear: { name: c.academicYearInfo?.name ?? "" },
	cycle: ref(c.cycle),
	cycleLevel: ref(c.cycleLevel),
	programOption: ref(c.programOption),
	semester: ref(c.semester),
});

interface ClassesFilters {
	page: number;
	pageSize: number;
	academicYearId: string | null;
	semesterId: string | null;
}

/** One page of classes, mapped to table rows. */
export function useClasses({
	page,
	pageSize,
	academicYearId,
	semesterId,
}: ClassesFilters) {
	const query = useQuery(
		trpc.classes.listPaged.queryOptions({
			page,
			pageSize,
			academicYearId: academicYearId || undefined,
			semesterId: semesterId || undefined,
		}),
	);
	return {
		...query,
		classes: (query.data?.items ?? []).map(toClassRow),
	};
}

/** Deletes one or several classes and refreshes the list. */
export function useDeleteClasses() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(ids.map((id) => trpcClient.classes.delete.mutate({ id }))),
		onSuccess: (_, ids) => {
			queryClient.invalidateQueries(trpc.classes.listPaged.queryKey());
			toast.success(
				ids.length === 1
					? t("admin.classes.toast.deleteSuccess")
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) => {
			toast.error(
				ids.length === 1 && error instanceof Error && error.message
					? error.message
					: ids.length === 1
						? t("admin.classes.toast.deleteError")
						: t("common.bulkActions.deleteError", {
								defaultValue: "Failed to delete items",
							}),
			);
		},
	});
}
