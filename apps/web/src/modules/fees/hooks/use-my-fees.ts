import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";

/** Fee assignments of the signed-in student, with orders and payments. */
export function useMyFinancialHistory() {
	return useQuery(trpc.feeClearance.myFinancialHistory.queryOptions());
}

/** Lets the student generate a payment order for some installments (or the balance). */
export function useCreateMyOrder(onSuccess: () => void) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			feeAssignmentId: string;
			amount?: number;
			installmentIds: string[];
		}) => trpcClient.feeClearance.myCreateOrder.mutate(input),
		onSuccess: () => {
			onSuccess();
			queryClient.invalidateQueries({
				queryKey: trpc.feeClearance.myFinancialHistory.queryKey(),
			});
		},
	});
}
