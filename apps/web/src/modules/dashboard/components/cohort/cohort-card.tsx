import { motion } from "framer-motion";
import {
	AlertCircle,
	BarChart3,
	CheckCircle2,
	Clock,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/number-format";
import type { CohortData } from "../../types";

function ProgressBar({
	value,
	color = "bg-primary",
}: {
	value: number;
	color?: string;
}) {
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<motion.div
				className={`h-full rounded-full ${color}`}
				initial={{ width: 0 }}
				animate={{ width: `${Math.min(100, value)}%` }}
				transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
			/>
		</div>
	);
}

function progressColor(pct: number) {
	if (pct === 100) return "bg-emerald-500";
	if (pct >= 60) return "bg-primary";
	return "bg-amber-500";
}

export function CohortCard({ cohort }: { cohort: CohortData }) {
	const { t } = useTranslation();
	const hasResults = cohort.successRate !== null;

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-sm">
			<div className="border-b bg-muted/30 px-5 py-3">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-semibold text-foreground text-sm">
							{cohort.className}
						</p>
						{cohort.academicYear && (
							<p className="text-muted-foreground text-xs">
								{cohort.academicYear}
							</p>
						)}
					</div>
					<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
						<Users className="h-3.5 w-3.5" />
						{cohort.totalStudents} {t("dean.cohort.students").toLowerCase()}
					</div>
				</div>
			</div>

			<div className="space-y-4 p-5">
				<div>
					<div className="mb-1.5 flex items-center justify-between">
						<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<Clock className="h-3.5 w-3.5" />
							{t("dean.cohort.gradingProgress")}
						</span>
						<span className="font-semibold text-foreground text-xs tabular-nums">
							{cohort.gradingProgress !== null
								? `${cohort.gradingProgress}%`
								: "—"}
						</span>
					</div>
					<ProgressBar
						value={cohort.gradingProgress ?? 0}
						color={progressColor(cohort.gradingProgress ?? 0)}
					/>
					<div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
						<span className="flex items-center gap-1">
							<CheckCircle2 className="h-3 w-3 text-emerald-500" />
							{cohort.approvedExams} {t("dean.cohort.approved")}
						</span>
						{cohort.submittedExams > 0 && (
							<span className="flex items-center gap-1 text-amber-500">
								<AlertCircle className="h-3 w-3" />
								{cohort.submittedExams} {t("dean.cohort.submitted")}
							</span>
						)}
						<span>
							{t("dean.cohort.totalExams", { count: cohort.totalExams })}
						</span>
					</div>
				</div>

				{hasResults ? (
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-muted/50 p-3 text-center">
							<p className="font-bold text-foreground text-xl tabular-nums">
								{cohort.avgGeneral !== null
									? cohort.avgGeneral.toFixed(2)
									: "—"}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("dean.cohort.avgGeneral")}
							</p>
						</div>
						<div
							className="rounded-lg bg-muted/50 p-3 text-center"
							title={t("dean.cohort.hint.success")}
						>
							<p className="font-bold text-foreground text-xl tabular-nums">
								{formatPercent((cohort.successRate ?? 0) / 100)}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("dean.cohort.successRate")}
							</p>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2.5 text-muted-foreground text-xs">
						<BarChart3 className="h-3.5 w-3.5 shrink-0" />
						{t("dean.cohort.noDeliberation")}
					</div>
				)}

				{cohort.submittedExams > 0 && (
					<div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
						<span className="text-amber-700 text-xs dark:text-amber-400">
							{t("dean.cohort.submittedExams", {
								count: cohort.submittedExams,
							})}
						</span>
						<Badge variant="warning" className="text-xs">
							{t("dean.cohort.actionRequired")}
						</Badge>
					</div>
				)}
			</div>
		</div>
	);
}
