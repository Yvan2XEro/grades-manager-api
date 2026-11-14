import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BatchJob } from "../types";

export function BatchJobFailureSummary({ job }: { job: BatchJob }) {
	const { t } = useTranslation();
	return (
		<div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
			<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
			<div className="space-y-1">
				<p className="font-medium text-red-800 text-sm">
					{job.status === "stale"
						? t("admin.batchJobs.detail.timedOut", {
								defaultValue: "Job timed out",
							})
						: t("admin.batchJobs.detail.failureSummary", {
								defaultValue: "Job failed",
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
	);
}
