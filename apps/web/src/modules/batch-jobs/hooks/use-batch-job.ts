import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Confirm } from "@/components/callable/confirm";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { BatchJob } from "../types";

type ConfirmAction = "cancel" | "rollback";

const ACTIVE_STATUSES = ["pending", "running"];

/** One job, polled every 2 s while it is active. */
export function useBatchJob(jobId: string | undefined) {
	const jobQuery = useQuery({
		...trpc.batchJobs.get.queryOptions({ jobId: jobId! }),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return ACTIVE_STATUSES.includes(status ?? "") ? 2000 : false;
		},
	});
	const job: BatchJob | undefined = jobQuery.data ?? undefined;
	return { job, isLoading: jobQuery.isLoading };
}

/** Run / cancel / rollback of one job; cancel and rollback ask for confirmation. */
export function useBatchJobActions(jobId: string | undefined) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const invalidateJob = () =>
		queryClient.invalidateQueries(
			trpc.batchJobs.get.queryFilter({ jobId: jobId! }),
		);
	const invalidateList = () =>
		queryClient.invalidateQueries(trpc.batchJobs.list.queryFilter({}));

	const runMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.run.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.runSuccess"));
			invalidateJob();
			invalidateList();
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const cancelMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.cancel.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.cancelSuccess"));
			invalidateJob();
		},
		onError: (err) => {
			toast.error((err as Error).message);
		},
	});

	const rollbackMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.rollback.mutate({ jobId: jobId! }),
		onSuccess: (result) => {
			toast.success(t("admin.batchJobs.toast.rollbackSuccess"));
			invalidateJob();
			invalidateList();
			// Navigate to the newly created rollback job
			if (result?.id) navigate(`/batch-jobs/${result.id}`);
		},
		onError: (err) => {
			toast.error((err as Error).message);
		},
	});

	const confirmJobAction = (action: ConfirmAction) =>
		Confirm.call({
			title:
				action === "cancel"
					? t("admin.batchJobs.confirm.cancelTitle", {
							defaultValue: "Cancel job?",
						})
					: t("admin.batchJobs.confirm.rollbackTitle", {
							defaultValue: "Rollback job?",
						}),
			description:
				action === "cancel"
					? t("admin.batchJobs.confirm.cancelMessage", {
							defaultValue:
								"Cancelling will stop the job immediately. Partially processed data will not be reverted.",
						})
					: t("admin.batchJobs.confirm.rollbackMessage", {
							defaultValue:
								"A new rollback job will be created to undo the changes made by this job. This action cannot itself be undone.",
						}),
			confirmLabel:
				action === "cancel"
					? t("admin.batchJobs.actions.cancel")
					: t("admin.batchJobs.actions.rollback"),
			cancelLabel: t("common.cancel"),
			mutationFn: async (call) => {
				try {
					if (action === "cancel") await cancelMutation.mutateAsync();
					else await rollbackMutation.mutateAsync();
				} catch {
					// toast shown by the mutation
				} finally {
					call.end(true);
				}
			},
		});

	return { runMutation, cancelMutation, rollbackMutation, confirmJobAction };
}
