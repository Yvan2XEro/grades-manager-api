import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	ExternalLink,
	Loader2,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { toast } from "@/lib/toast";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { type RouterOutputs, trpc, trpcClient } from "../../../utils/trpc";

type BatchJob = NonNullable<RouterOutputs["batchJobs"]["get"]>;

const stepStatusColors: Record<string, string> = {
	pending: "bg-muted text-foreground",
	running: "bg-blue-100 text-blue-800",
	completed: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	skipped: "bg-yellow-100 text-yellow-800",
};

const logLevelColors: Record<string, string> = {
	info: "text-blue-600",
	warn: "text-amber-600",
	error: "text-red-600",
};

type ConfirmAction = "cancel" | "rollback";

export default function BatchJobDetail() {
	const { t } = useTranslation();
	const { jobId } = useParams<{ jobId: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
		null,
	);

	const jobQuery = useQuery({
		...trpc.batchJobs.get.queryOptions({ jobId: jobId! }),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status === "running" ? 2000 : false;
		},
	});

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
			setConfirmAction(null);
		},
		onError: (err) => {
			toast.error((err as Error).message);
			setConfirmAction(null);
		},
	});

	const rollbackMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.rollback.mutate({ jobId: jobId! }),
		onSuccess: (result) => {
			toast.success(t("admin.batchJobs.toast.rollbackSuccess"));
			invalidateJob();
			invalidateList();
			setConfirmAction(null);
			// Navigate to the newly created rollback job
			if (result?.id) navigate(`/admin/batch-jobs/${result.id}`);
		},
		onError: (err) => {
			toast.error((err as Error).message);
			setConfirmAction(null);
		},
	});

	const job: BatchJob | undefined = jobQuery.data ?? undefined;

	if (jobQuery.isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
			</div>
		);
	}

	if (!job) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyDescription>
						{t("admin.batchJobs.detail.notFound", {
							defaultValue: "Job not found",
						})}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const progress = job.progress;
	const isFailed = job.status === "failed" || job.status === "stale";
	const canRun = job.status === "previewed";
	const canCancel =
		job.status === "pending" ||
		job.status === "previewed" ||
		job.status === "running";
	const canRollback = job.status === "completed";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate("/admin/batch-jobs")}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-foreground">
							{t(`admin.batchJobs.types.${job.type}`, {
								defaultValue: job.type,
							})}
						</h1>
						<p className="text-muted-foreground text-xs">
							{formatDistanceToNow(new Date(job.createdAt), {
								addSuffix: true,
							})}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{canRun && (
						<Button
							onClick={() => runMutation.mutate()}
							disabled={runMutation.isPending}
						>
							{runMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{t("admin.batchJobs.actions.run")}
						</Button>
					)}
					{canCancel && (
						<Button
							variant="outline"
							onClick={() => setConfirmAction("cancel")}
							disabled={cancelMutation.isPending}
						>
							{t("admin.batchJobs.actions.cancel")}
						</Button>
					)}
					{canRollback && (
						<Button
							variant="outline"
							onClick={() => setConfirmAction("rollback")}
							disabled={rollbackMutation.isPending}
						>
							<RotateCcw className="mr-2 h-4 w-4" />
							{t("admin.batchJobs.actions.rollback")}
						</Button>
					)}
				</div>
			</div>

			{/* Parent / rollback job links */}
			{(job.parentJobId || job.rollbackJobId) && (
				<div className="flex flex-wrap gap-3">
					{job.parentJobId && (
						<Link
							to={`/admin/batch-jobs/${job.parentJobId}`}
							className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/50"
						>
							<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
							{t("admin.batchJobs.detail.originalJob", {
								defaultValue: "View original job",
							})}
						</Link>
					)}
					{job.rollbackJobId && (
						<Link
							to={`/admin/batch-jobs/${job.rollbackJobId}`}
							className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/50"
						>
							<RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
							{t("admin.batchJobs.detail.rollbackJob", {
								defaultValue: "View rollback job",
							})}
						</Link>
					)}
				</div>
			)}

			{/* Failure summary */}
			{isFailed && (
				<div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
					<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
					<div className="space-y-1">
						<p className="font-medium text-red-800 text-sm">
							{t("admin.batchJobs.detail.failureSummary", {
								defaultValue:
									job.status === "stale" ? "Job timed out" : "Job failed",
							})}
						</p>
						{job.error && <p className="text-red-700 text-sm">{job.error}</p>}
						{job.steps?.some((s) => s.status === "failed") && (
							<ul className="mt-2 space-y-0.5 text-red-700 text-xs">
								{job.steps
									.filter((s) => s.status === "failed")
									.map((s) => (
										<li key={s.id}>
											<span className="font-medium">{s.name}:</span>{" "}
											{s.error ??
												t("admin.batchJobs.detail.unknownError", {
													defaultValue: "Unknown error",
												})}
										</li>
									))}
							</ul>
						)}
					</div>
				</div>
			)}

			{/* Status + Progress */}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.batchJobs.columns.status")}
					</h3>
					<Badge
						variant={
							job.status === "completed"
								? "default"
								: isFailed
									? "destructive"
									: "secondary"
						}
						className="text-sm"
					>
						{t(`admin.batchJobs.status.${job.status}`, {
							defaultValue: job.status,
						})}
					</Badge>
				</div>

				{progress && (
					<div className="rounded-xl border bg-card p-5 shadow-sm">
						<h3 className="mb-3 font-medium text-foreground text-sm">
							{t("admin.batchJobs.detail.progress")}
						</h3>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{t("admin.batchJobs.detail.step", {
										current: progress.currentStep,
										total: progress.totalSteps,
										defaultValue: `Step ${progress.currentStep}/${progress.totalSteps}`,
									})}
								</span>
								<span className="font-medium">
									{progress.itemsProcessed}/{progress.itemsTotal}{" "}
									{t("admin.batchJobs.detail.items", { defaultValue: "items" })}
								</span>
							</div>
							<div className="h-3 w-full rounded-full bg-gray-200">
								<div
									className="h-3 rounded-full bg-primary transition-all"
									style={{
										width: `${progress.itemsTotal > 0 ? (progress.itemsProcessed / progress.itemsTotal) * 100 : 0}%`,
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Steps timeline */}
			<div className="rounded-xl border bg-card p-5 shadow-sm">
				<h3 className="mb-4 font-medium text-foreground text-sm">
					{t("admin.batchJobs.detail.steps")}
				</h3>
				<div className="space-y-3">
					{(job.steps ?? []).map((step, i) => (
						<div
							key={step.id}
							className="flex items-center gap-4 rounded-lg border p-4"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-foreground text-sm">
								{i + 1}
							</div>
							<div className="flex-1">
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">{step.name}</span>
									<span
										className={`rounded-full px-2 py-0.5 text-xs ${stepStatusColors[step.status] ?? "bg-muted"}`}
									>
										{t(`admin.batchJobs.stepStatus.${step.status}`, {
											defaultValue: step.status,
										})}
									</span>
								</div>
								{(step.itemsProcessed ?? 0) > 0 && (
									<div className="mt-1 flex gap-3 text-muted-foreground text-xs">
										<span>
											{t("admin.batchJobs.detail.processed", {
												count: step.itemsProcessed,
												defaultValue: `Processed: ${step.itemsProcessed}`,
											})}
										</span>
										{(step.itemsSkipped ?? 0) > 0 && (
											<span>
												{t("admin.batchJobs.detail.skipped", {
													count: step.itemsSkipped,
													defaultValue: `Skipped: ${step.itemsSkipped}`,
												})}
											</span>
										)}
										{(step.itemsFailed ?? 0) > 0 && (
											<span className="text-red-500">
												{t("admin.batchJobs.detail.failed", {
													count: step.itemsFailed,
													defaultValue: `Failed: ${step.itemsFailed}`,
												})}
											</span>
										)}
									</div>
								)}
								{step.error && (
									<p className="mt-1 text-red-600 text-xs">{step.error}</p>
								)}
							</div>
							<div className="text-muted-foreground/60">
								{step.status === "completed" && (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								)}
								{step.status === "running" && (
									<Loader2 className="h-5 w-5 animate-spin text-blue-500" />
								)}
								{step.status === "failed" && (
									<XCircle className="h-5 w-5 text-red-500" />
								)}
								{step.status === "pending" && (
									<Clock className="h-5 w-5 text-muted-foreground/40" />
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Logs */}
			<div className="rounded-xl border bg-card p-5 shadow-sm">
				<h3 className="mb-4 font-medium text-foreground text-sm">
					{t("admin.batchJobs.detail.logs")}
				</h3>
				{(job.logs ?? []).length === 0 ? (
					<p className="text-muted-foreground text-xs">
						{t("admin.batchJobs.detail.noLogs")}
					</p>
				) : (
					<div className="max-h-96 space-y-1 overflow-y-auto font-mono text-xs">
						{(job.logs ?? []).map((log) => (
							<div key={log.id} className="flex gap-2 py-1">
								<span className="text-muted-foreground/60">
									{new Date(log.timestamp).toLocaleTimeString()}
								</span>
								<span
									className={`font-medium uppercase ${logLevelColors[log.level] ?? "text-muted-foreground"}`}
								>
									[{log.level}]
								</span>
								<span className="text-foreground">{log.message}</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Confirm cancel / rollback dialog */}
			<Dialog
				open={confirmAction !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmAction(null);
				}}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{confirmAction === "cancel"
								? t("admin.batchJobs.confirm.cancelTitle", {
										defaultValue: "Cancel job?",
									})
								: t("admin.batchJobs.confirm.rollbackTitle", {
										defaultValue: "Rollback job?",
									})}
						</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						{confirmAction === "cancel"
							? t("admin.batchJobs.confirm.cancelMessage", {
									defaultValue:
										"Cancelling will stop the job immediately. Partially processed data will not be reverted.",
								})
							: t("admin.batchJobs.confirm.rollbackMessage", {
									defaultValue:
										"A new rollback job will be created to undo the changes made by this job. This action cannot itself be undone.",
								})}
					</p>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setConfirmAction(null)}>
							{t("common.cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={cancelMutation.isPending || rollbackMutation.isPending}
							onClick={() => {
								if (confirmAction === "cancel") cancelMutation.mutate();
								else rollbackMutation.mutate();
							}}
						>
							{(cancelMutation.isPending || rollbackMutation.isPending) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{confirmAction === "cancel"
								? t("admin.batchJobs.actions.cancel")
								: t("admin.batchJobs.actions.rollback")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
