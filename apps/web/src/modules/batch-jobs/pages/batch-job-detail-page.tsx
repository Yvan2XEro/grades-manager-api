import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { BatchJobFailureSummary } from "../components/batch-job-failure-summary";
import { BatchJobLogs } from "../components/batch-job-logs";
import { BatchJobOverview } from "../components/batch-job-overview";
import { BatchJobSteps } from "../components/batch-job-steps";
import { useBatchJob, useBatchJobActions } from "../hooks/use-batch-job";

export default function BatchJobDetailPage() {
	const { t } = useTranslation();
	const { jobId } = useParams<{ jobId: string }>();
	const navigate = useNavigate();
	const { job, isLoading } = useBatchJob(jobId);
	const { runMutation, cancelMutation, rollbackMutation, confirmJobAction } =
		useBatchJobActions(jobId);

	if (isLoading) {
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
						onClick={() => navigate("/batch-jobs")}
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
							onClick={() => confirmJobAction("cancel")}
							disabled={cancelMutation.isPending}
						>
							{t("admin.batchJobs.actions.cancel")}
						</Button>
					)}
					{canRollback && (
						<Button
							variant="outline"
							onClick={() => confirmJobAction("rollback")}
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
							to={`/batch-jobs/${job.parentJobId}`}
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
							to={`/batch-jobs/${job.rollbackJobId}`}
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

			{isFailed && <BatchJobFailureSummary job={job} />}

			<BatchJobOverview job={job} />

			<BatchJobSteps steps={job.steps} />

			<BatchJobLogs job={job} />
		</div>
	);
}
