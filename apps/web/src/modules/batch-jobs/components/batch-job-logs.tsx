import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { BatchJob, LogLevel } from "../types";

const logLevelColors: Record<string, string> = {
	info: "text-blue-600",
	warn: "text-amber-600",
	error: "text-red-600",
};

/** Logs of a job, filterable by level. */
export function BatchJobLogs({ job }: { job: BatchJob }) {
	const { t } = useTranslation();
	const [logLevel, setLogLevel] = useState<LogLevel>("all");
	const stepNameMap = Object.fromEntries(
		(job.steps ?? []).map((s) => [s.id, s.name]),
	);
	const filteredLogs = (job.logs ?? []).filter(
		(l) => logLevel === "all" || l.level === logLevel,
	);
	return (
		<div className="rounded-xl border bg-card p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="font-medium text-foreground text-sm">
					{t("admin.batchJobs.detail.logs")}
				</h3>
				{(job.logs ?? []).length > 0 && (
					<Select
						value={logLevel}
						onValueChange={(v) => setLogLevel(v as LogLevel)}
					>
						<SelectTrigger className="h-7 w-[100px] text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								{t("admin.batchJobs.detail.logLevel.all")}
							</SelectItem>
							<SelectItem value="info">
								{t("admin.batchJobs.detail.logLevel.info")}
							</SelectItem>
							<SelectItem value="warn">
								{t("admin.batchJobs.detail.logLevel.warn")}
							</SelectItem>
							<SelectItem value="error">
								{t("admin.batchJobs.detail.logLevel.error")}
							</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>
			{filteredLogs.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("admin.batchJobs.detail.noLogs")}
				</p>
			) : (
				<div className="max-h-96 space-y-1 overflow-y-auto font-mono text-xs">
					{filteredLogs.map((log) => {
						const stepName = log.stepId ? stepNameMap[log.stepId] : null;
						return (
							<div key={log.id} className="flex gap-2 py-1">
								<span className="text-muted-foreground/60">
									{new Date(log.timestamp).toLocaleTimeString()}
								</span>
								<span
									className={`font-medium uppercase ${logLevelColors[log.level] ?? "text-muted-foreground"}`}
								>
									[{log.level}]
								</span>
								{stepName && (
									<span className="text-muted-foreground/70">
										[{t("admin.batchJobs.detail.logStep")}: {stepName}]
									</span>
								)}
								<span className="text-foreground">{log.message}</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
