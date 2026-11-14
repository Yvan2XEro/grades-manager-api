import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BatchJob } from "../types";

const stepStatusColors: Record<string, string> = {
	pending: "bg-muted text-foreground",
	running: "bg-blue-100 text-blue-800",
	completed: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	skipped: "bg-yellow-100 text-yellow-800",
};

/** Timeline of the steps of a job. */
export function BatchJobSteps({ steps }: { steps: BatchJob["steps"] }) {
	const { t } = useTranslation();
	return (
		<div className="rounded-xl border bg-card p-5 shadow-sm">
			<h3 className="mb-4 font-medium text-foreground text-sm">
				{t("admin.batchJobs.detail.steps")}
			</h3>
			<div className="space-y-3">
				{(steps ?? []).map((step, i) => (
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
	);
}
