import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createElement } from "react";
import { useTranslation } from "react-i18next";
import { Confirm } from "@/components/callable/confirm";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import { ActivationChecklist } from "../components/activation-checklist";

const errorMessage = (error: unknown, fallback: string) =>
	error instanceof Error && error.message ? error.message : fallback;

/**
 * Message for a failed create / update / create-next: a year whose name is
 * already used comes back as CONFLICT and is explained in the UI language.
 */
export function yearSaveErrorMessage(
	error: unknown,
	fallback: string,
	t: (key: "admin.academicYears.toast.yearExists") => string,
) {
	const code = (error as { data?: { code?: string } } | null)?.data?.code;
	if (code === "CONFLICT") return t("admin.academicYears.toast.yearExists");
	return errorMessage(error, fallback);
}

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
		queryClient.invalidateQueries({
			queryKey: trpc.academicYears.listPaged.queryKey(),
		});
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
					: t("common.bulkActions.deleteSuccess"),
			);
		},
		onError: (error, ids) =>
			toast.error(
				ids.length === 1
					? errorMessage(error, t("admin.academicYears.toast.deleteError"))
					: t("common.bulkActions.deleteError"),
			),
	});
}

/** Activates or deactivates an academic year. */
export function useToggleAcademicYearActive() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			await trpcClient.academicYears.setActive.mutate({ id, isActive });
		},
		onSuccess: () => {
			// The active year drives filters and dashboards everywhere
			queryClient.invalidateQueries();
			toast.success(t("admin.academicYears.toast.statusSuccess"));
		},
		onError: (error) =>
			toast.error(
				(error as { data?: { code?: string } }).data?.code === "FORBIDDEN"
					? t("admin.academicYears.toast.statusForbidden")
					: t("admin.academicYears.toast.statusError"),
			),
	});
}

/**
 * Activation of a year, after a confirmation that lists what is still open in
 * the year being left (juries, students without a class). Deactivation needs
 * no checklist. Resolves `true` once the year was switched.
 */
export function useActivateAcademicYear() {
	const { t } = useTranslation();
	const toggle = useToggleAcademicYearActive();
	return (year: { id: string; name: string; isActive: boolean }) => {
		if (year.isActive) {
			return toggle
				.mutateAsync({ id: year.id, isActive: false })
				.then(() => true)
				.catch(() => false);
		}
		return Confirm.call({
			title: t("admin.academicYears.activate.title", { year: year.name }),
			description: createElement(ActivationChecklist, { year }),
			confirmLabel: t("admin.academicYears.activate.confirm"),
			destructive: false,
			mutationFn: async (call) => {
				try {
					await toggle.mutateAsync({ id: year.id, isActive: true });
					call.end(true);
				} catch {
					// error toast shown by the mutation; the dialog stays open
				}
			},
		});
	};
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
					name: newYear.name,
				}),
			);
			onCreated(newYear);
		},
		onError: (error) =>
			toast.error(
				yearSaveErrorMessage(
					error,
					t("admin.academicYears.toast.createNextYearError"),
					t,
				),
			),
	});
}
