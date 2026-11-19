import { motion } from "framer-motion";
import {
	AlertCircle,
	GraduationCap,
	Info,
	TrendingUp,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";
import { formatPercent } from "@/lib/number-format";

export function CohortKpis({
	totalStudents,
	totalPending,
	avgProgress,
	avgSuccessRate,
}: {
	totalStudents: number;
	totalPending: number;
	avgProgress: number | null;
	/** Ratio (0–1) of admitted + compensated among deliberated students. */
	avgSuccessRate: number | null;
}) {
	const { t } = useTranslation();
	const kpis = [
		{
			icon: <Users className="h-5 w-5 text-primary" />,
			bg: "bg-primary/10",
			label: t("dean.cohort.students"),
			value: totalStudents,
			hint: t("dean.cohort.hint.students"),
		},
		{
			icon: (
				<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
			),
			bg: "bg-amber-100 dark:bg-amber-900/30",
			label: t("dean.cohort.pending"),
			value: totalPending,
			hint: t("dean.cohort.hint.pending"),
		},
		{
			icon: <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
			bg: "bg-blue-100 dark:bg-blue-900/30",
			label: t("dean.cohort.avgProgress"),
			value: avgProgress !== null ? `${avgProgress}%` : "—",
			hint: t("dean.cohort.hint.progress"),
		},
		{
			icon: (
				<GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
			),
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			label: t("dean.cohort.avgSuccess"),
			value: formatPercent(avgSuccessRate),
			hint: t("dean.cohort.hint.success"),
		},
	];

	return (
		<motion.div
			variants={staggerItem}
			className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
		>
			{kpis.map((kpi) => (
				<div
					key={kpi.label}
					title={kpi.hint}
					className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
				>
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.bg}`}
					>
						{kpi.icon}
					</div>
					<div>
						<p className="flex items-center gap-1 text-muted-foreground text-xs">
							{kpi.label}
							<Info className="h-3 w-3" aria-label={kpi.hint} />
						</p>
						<p className="font-bold text-foreground text-xl tabular-nums">
							{kpi.value}
						</p>
					</div>
				</div>
			))}
		</motion.div>
	);
}
