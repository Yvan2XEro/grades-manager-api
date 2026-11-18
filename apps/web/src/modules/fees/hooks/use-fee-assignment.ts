import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { downloadBase64 } from "@/lib/download";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

/** A fee assignment with its payments and payment orders. */
export function useFeeAssignment(id: string) {
	const queryClient = useQueryClient();
	const assignmentQuery = useQuery(
		trpc.feeClearance.getAssignment.queryOptions({ id }),
	);
	const { data: payments } = useQuery(
		trpc.feeClearance.listPayments.queryOptions({ feeAssignmentId: id }),
	);
	const { data: ordersData } = useQuery(
		trpc.feeClearance.listOrders.queryOptions({ feeAssignmentId: id }),
	);

	/** Refreshes the assignment, its payments and its orders. */
	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.getAssignment.queryKey({ id }),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listPayments.queryKey({
				feeAssignmentId: id,
			}),
		});
		queryClient.invalidateQueries({
			queryKey: trpc.feeClearance.listOrders.queryKey({ feeAssignmentId: id }),
		});
	};

	return {
		assignment: assignmentQuery.data,
		isLoading: assignmentQuery.isLoading,
		payments,
		orders: ordersData?.items ?? [],
		invalidate,
	};
}

export function useCancelOrder(onDone: () => void) {
	const { t } = useTranslation();
	return useMutation({
		mutationFn: (orderId: string) =>
			trpcClient.feeClearance.cancelOrder.mutate({ orderId }),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onDone();
		},
	});
}

export function useDeletePayment(onDone: () => void) {
	const { t } = useTranslation();
	return useMutation({
		mutationFn: (paymentId: string) =>
			trpcClient.feeClearance.deletePayment.mutate({ paymentId }),
		onSuccess: () => {
			toast.success(t("common.deleted"));
			onDone();
		},
	});
}

/**
 * Downloads a generated PDF; `downloadingId` is the id being downloaded so
 * its action can be disabled meanwhile.
 */
export function usePdfDownload(
	fetchPdf: (id: string) => Promise<{ pdf: string }>,
) {
	const { t } = useTranslation();
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const download = async (id: string, filename: string) => {
		setDownloadingId(id);
		try {
			const { pdf } = await fetchPdf(id);
			downloadBase64(pdf, filename, "application/pdf");
		} catch {
			toast.error(t("common.error"));
		} finally {
			setDownloadingId(null);
		}
	};
	return { downloadingId, download };
}
