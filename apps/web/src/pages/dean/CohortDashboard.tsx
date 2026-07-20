import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
	AlertCircle,
	BarChart3,
	CheckCircle2,
	Clock,
	GraduationCap,
	TrendingUp,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { trpc } from "../../utils/trpc";

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

type CohortData = {
	classId: string;
	className: string;
	academicYear: string | null;
	totalStudents: number;
	totalExams: number;
	approvedExams: number;
	submittedExams: number;
	gradingProgress: number;
	avgGeneral: number | null;
	admittedCount: number;
	successRate: number | null;
};

function CohortCard({ cohort }: { cohort: CohortData }) {
	const { t } = useTranslation();
	const hasResults = cohort.avgGeneral !== null;

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
							{cohort.gradingProgress}%
						</span>
					</div>
					<ProgressBar
						value={cohort.gradingProgress}
						color={progressColor(cohort.gradingProgress)}
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
						<span>{cohort.totalExams} total</span>
					</div>
				</div>

				{hasResults ? (
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-muted/50 p-3 text-center">
							<p className="font-bold text-foreground text-xl tabular-nums">
								{cohort.avgGeneral!.toFixed(2)}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("dean.cohort.avgGeneral")}
							</p>
						</div>
						<div className="rounded-lg bg-muted/50 p-3 text-center">
							<p className="font-bold text-foreground text-xl tabular-nums">
								{cohort.successRate ?? 0}%
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
							{cohort.submittedExams} examen
							{cohort.submittedExams > 1 ? "s" : ""}{" "}
							{t("dean.cohort.submitted")}
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

export default function CohortDashboard() {
	const { t } = useTranslation();
	const analyticsQuery = useQuery(
		trpc.workflows.cohortAnalytics.queryOptions({}),
	);
	const cohorts = analyticsQuery.data ?? [];

	const totalStudents = cohorts.reduce((s, c) => s + c.totalStudents, 0);
	const totalPending = cohorts.reduce((s, c) => s + c.submittedExams, 0);
	const avgProgress =
		cohorts.length > 0
			? Math.round(
					cohorts.reduce((s, c) => s + c.gradingProgress, 0) / cohorts.length,
				)
			: 0;
	const cohortsWithResults = cohorts.filter((c) => c.successRate !== null);
	const avgSuccessRate =
		cohortsWithResults.length > 0
			? Math.round(
					cohortsWithResults.reduce((s, c) => s + (c.successRate ?? 0), 0) /
						cohortsWithResults.length,
				)
			: null;

	const kpis = [
		{
			icon: <Users className="h-5 w-5 text-primary" />,
			bg: "bg-primary/10",
			label: t("dean.cohort.students"),
			value: totalStudents,
		},
		{
			icon: (
				<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
			),
			bg: "bg-amber-100 dark:bg-amber-900/30",
			label: t("dean.cohort.pending"),
			value: totalPending,
		},
		{
			icon: <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
			bg: "bg-blue-100 dark:bg-blue-900/30",
			label: t("dean.cohort.avgProgress"),
			value: `${avgProgress}%`,
		},
		{
			icon: (
				<GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
			),
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			label: t("dean.cohort.avgSuccess"),
			value: avgSuccessRate !== null ? `${avgSuccessRate}%` : "—",
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dean.cohort.title")}
				description={t("dean.cohort.subtitle")}
			/>

			{analyticsQuery.isPending ? (
				<div className="flex h-48 items-center justify-center">
					<Spinner className="h-8 w-8 text-primary" />
				</div>
			) : (
				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="space-y-6"
				>
					<motion.div
						variants={staggerItem}
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
					>
						{kpis.map((kpi) => (
							<div
								key={kpi.label}
								className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
							>
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}
								>
									{kpi.icon}
								</div>
								<div>
									<p className="text-muted-foreground text-xs">{kpi.label}</p>
									<p className="font-bold text-foreground text-xl tabular-nums">
										{kpi.value}
									</p>
								</div>
							</div>
						))}
					</motion.div>

					{cohorts.length === 0 ? (
						<motion.div variants={staggerItem}>
							<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
								<BarChart3 className="h-8 w-8 text-muted-foreground/40" />
								<div>
									<p className="font-medium text-foreground text-sm">
										{t("dean.cohort.noData")}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{t("dean.cohort.noDataHint")}
									</p>
								</div>
							</div>
						</motion.div>
					) : (
						<motion.div
							variants={staggerItem}
							className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
						>
							{cohorts.map((cohort) => (
								<CohortCard key={cohort.classId} cohort={cohort} />
							))}
						</motion.div>
					)}
				</motion.div>
			)}
		</div>
	);
}
