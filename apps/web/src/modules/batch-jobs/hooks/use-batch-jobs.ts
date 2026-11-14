import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

/** Jobs list, polled every 3 s while a job is still active. */
export function useBatchJobs(statusFilter: string) {
	const jobsQuery = useQuery({
		queryKey: ["batchJobs", statusFilter],
		queryFn: () =>
			trpcClient.batchJobs.list.query({
				status:
					statusFilter === "all"
						? undefined
						: [statusFilter as "pending" | "running" | "completed" | "failed"],
				limit: 50,
				offset: 0,
			}),
		refetchInterval: (query) => {
			const items = query.state.data?.items ?? [];
			const hasActive = items.some((j) =>
				["pending", "previewed", "running"].includes(j.status),
			);
			return hasActive ? 3000 : false;
		},
	});
	return {
		jobs: jobsQuery.data?.items ?? [],
		isLoading: jobsQuery.isLoading,
	};
}

/** Run / cancel from the jobs list. */
export function useBatchJobListActions() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const runMutation = useMutation({
		mutationFn: (jobId: string) => trpcClient.batchJobs.run.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.runSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const cancelMutation = useMutation({
		mutationFn: (jobId: string) =>
			trpcClient.batchJobs.cancel.mutate({ jobId }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.cancelSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	return { runMutation, cancelMutation };
}
