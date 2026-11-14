import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { exportDeliberationExcel } from "../services/deliberation-excel-export";
import type { DeliberationAction } from "../types";

/** Invalidates a deliberation and its activity log. */
export function useInvalidateDeliberation(deliberationId: string) {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({
			queryKey: ["deliberation", deliberationId],
		});
		queryClient.invalidateQueries({
			queryKey: ["deliberation-logs", deliberationId],
		});
	};
}

/** A deliberation (with its student results) and its activity log. */
export function useDeliberation(deliberationId: string | undefined) {
	const deliberationQuery = useQuery({
		queryKey: ["deliberation", deliberationId],
		queryFn: () =>
			trpcClient.deliberations.getById.query({ id: deliberationId! }),
		enabled: !!deliberationId,
	});
	const logsQuery = useQuery({
		queryKey: ["deliberation-logs", deliberationId],
		queryFn: () =>
			trpcClient.deliberations.getLogs.query({
				deliberationId: deliberationId!,
			}),
		enabled: !!deliberationId,
	});
	return { deliberationQuery, logsQuery };
}

/** Workflow actions of a deliberation: open/close/sign/reopen, compute, exports. */
export function useDeliberationActions(deliberationId: string) {
	const { t } = useTranslation();
	const invalidateAll = useInvalidateDeliberation(deliberationId);

	const transition = useMutation({
		mutationFn: (action: DeliberationAction) =>
			trpcClient.deliberations.transition.mutate({
				id: deliberationId,
				action,
			}),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.transitionSuccess"));
			invalidateAll();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const compute = useMutation({
		mutationFn: () =>
			trpcClient.deliberations.compute.mutate({ id: deliberationId }),
		onSuccess: () => {
			toast.success(t("admin.deliberations.toast.computeSuccess"));
			invalidateAll();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const pdfExport = useMutation({
		mutationFn: () =>
			trpcClient.exports.generateDeliberation.mutate({
				deliberationId,
				format: "pdf",
			}),
		onSuccess: (result) => {
			downloadBase64(result.data, result.filename, result.mimeType);
			toast.success(t("admin.deliberations.toast.exportSuccess"));
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const excelExport = useMutation({
		mutationFn: () =>
			trpcClient.exports.getDeliberationData.query({ deliberationId }),
		onSuccess: (data) => {
			exportDeliberationExcel(data);
			toast.success(t("admin.deliberations.toast.exportSuccess"));
		},
		onError: (err) => toast.error((err as Error).message),
	});

	return { transition, compute, pdfExport, excelExport };
}
