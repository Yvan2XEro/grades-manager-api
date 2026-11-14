import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

const errorMessage = (error: unknown, fallback: string) =>
	error instanceof Error && error.message ? error.message : fallback;

/** One page of academic years. */
export function useAcademicYears({
	page,
	pageSize,
}: {
	page: number;
	pageSize: number;
}) {
	const query = useQuery(
		trpc.academicYears.listPaged.queryOptions({ page, pageSize }),
	);
	return { ...query, academicYears: query.data?.items ?? [] };
}

function useInvalidateAcademicYears() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries(trpc.academicYears.listPaged.queryKey());
}

/** Deletes one or several academic years and refreshes the list. */
export function useDeleteAcademicYears() {
	const { t } = useTranslation();
	const invalidate = useInvalidateAcademicYears();
	return useMutation({
		mutationFn: (ids: string[]) =>
			Promise.all(
				ids.map((id) => trpcClient.academicYears.delete.mutate({ id })),
			),
		onSuccess: (_, ids) => {
			invalidate();
			toast.success(
				ids.length === 1
					? t("admin.academicYears.toast.deleteSuccess")
					: t("common.bulkActions.deleteSuccess", {
							defaultValue: "Items deleted successfully",
						}),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? errorMessage(error, t("admin.academicYears.toast.deleteError"))
					: t("common.bulkActions.deleteError", {
							defaultValue: "Failed to delete items",
						}),
			),
	});
}

/** Activates or deactivates an academic year. */
export function useToggleAcademicYearActive() {
	const { t } = useTranslation();
	const invalidate = useInvalidateAcademicYears();
	return useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			await trpcClient.academicYears.setActive.mutate({ id, isActive });
		},
		onSuccess: () => {
			invalidate();
			toast.success(t("admin.academicYears.toast.statusSuccess"));
		},
		onError: (error) =>
			toast.error(
				errorMessage(error, t("admin.academicYears.toast.statusError")),
			),
	});
}

/** Creates the year following a source year; `onCreated` receives the new year. */
export function useCreateNextAcademicYear(
	onCreated: (year: { id: string; name: string }) => void,
) {
	const { t } = useTranslation();
	const invalidate = useInvalidateAcademicYears();
	return useMutation({
		mutationFn: (sourceYearId: string) =>
			trpcClient.academicYears.createNextYear.mutate({ sourceYearId }),
		onSuccess: (newYear) => {
			invalidate();
			toast.success(
				t("admin.academicYears.toast.createNextYearSuccess", {
					defaultValue: "Année suivante créée : {{name}}",
					name: newYear.name,
				}),
			);
			onCreated(newYear);
		},
		onError: (error) =>
			toast.error(
				errorMessage(
					error,
					t("admin.academicYears.toast.createNextYearError", {
						defaultValue: "Erreur lors de la création de l'année suivante",
					}),
				),
			),
	});
}
