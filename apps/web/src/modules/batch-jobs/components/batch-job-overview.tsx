import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { BatchJob } from "../types";

/** Status and progress cards of a job. */
export function BatchJobOverview({ job }: { job: BatchJob }) {
	const { t } = useTranslation();
	const progress = job.progress;
	const isFailed = job.status === "failed" || job.status === "stale";
	return (
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
	);
}
