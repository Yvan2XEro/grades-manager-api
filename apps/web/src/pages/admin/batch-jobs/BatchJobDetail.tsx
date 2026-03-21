import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	Loader2,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { trpcClient } from "../../../utils/trpc";

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

export default function BatchJobDetail() {
	const { t } = useTranslation();
	const { jobId } = useParams<{ jobId: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const jobQuery = useQuery({
		queryKey: ["batchJob", jobId],
		queryFn: () => trpcClient.batchJobs.get.query({ jobId: jobId! }),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status === "running" ? 2000 : false;
		},
	});

	const runMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.run.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.runSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJob", jobId] });
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const cancelMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.cancel.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.cancelSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJob", jobId] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const rollbackMutation = useMutation({
		mutationFn: () => trpcClient.batchJobs.rollback.mutate({ jobId: jobId! }),
		onSuccess: () => {
			toast.success(t("admin.batchJobs.toast.rollbackSuccess"));
			queryClient.invalidateQueries({ queryKey: ["batchJob", jobId] });
			queryClient.invalidateQueries({ queryKey: ["batchJobs"] });
		},
		onError: (err) => toast.error((err as Error).message),
	});

	const job = jobQuery.data;

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
					<EmptyDescription>Job not found</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const progress = job.progress as {
		currentStep: number;
		totalSteps: number;
		itemsProcessed: number;
		itemsTotal: number;
	} | null;

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
					{job.status === "previewed" && (
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
					{(job.status === "pending" ||
						job.status === "previewed" ||
						job.status === "running") && (
						<Button
							variant="outline"
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
						>
							{t("admin.batchJobs.actions.cancel")}
						</Button>
					)}
					{job.status === "completed" && (
						<Button
							variant="outline"
							onClick={() => rollbackMutation.mutate()}
							disabled={rollbackMutation.isPending}
						>
							<RotateCcw className="mr-2 h-4 w-4" />
							{t("admin.batchJobs.actions.rollback")}
						</Button>
					)}
				</div>
			</div>

			{/* Status + Progress */}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-xl border bg-white p-5 shadow-sm">
					<h3 className="mb-3 font-medium text-foreground text-sm">
						{t("admin.batchJobs.columns.status")}
					</h3>
					<Badge
						variant={
							job.status === "completed"
								? "default"
								: job.status === "failed" || job.status === "stale"
									? "destructive"
									: "secondary"
						}
						className="text-sm"
					>
						{t(`admin.batchJobs.status.${job.status}`, {
							defaultValue: job.status,
						})}
					</Badge>
					{job.error && (
						<div className="mt-3 rounded-lg bg-red-50 p-3 text-red-700 text-sm">
							{job.error}
						</div>
					)}
				</div>

				{progress && (
					<div className="rounded-xl border bg-white p-5 shadow-sm">
						<h3 className="mb-3 font-medium text-foreground text-sm">
							{t("admin.batchJobs.detail.progress")}
						</h3>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Step {progress.currentStep}/{progress.totalSteps}
								</span>
								<span className="font-medium">
									{progress.itemsProcessed}/{progress.itemsTotal} items
								</span>
							</div>
							<div className="h-3 w-full rounded-full bg-gray-200">
								<div
									className="h-3 rounded-full bg-primary-600 transition-all"
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
			<div className="rounded-xl border bg-white p-5 shadow-sm">
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
										<span>Processed: {step.itemsProcessed}</span>
										{(step.itemsSkipped ?? 0) > 0 && (
											<span>Skipped: {step.itemsSkipped}</span>
										)}
										{(step.itemsFailed ?? 0) > 0 && (
											<span className="text-red-500">
												Failed: {step.itemsFailed}
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
			<div className="rounded-xl border bg-white p-5 shadow-sm">
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
		</div>
	);
}
