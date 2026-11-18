import { motion } from "framer-motion";
import { AlertCircle, GraduationCap, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { staggerItem } from "@/lib/animations";

export function CohortKpis({
	totalStudents,
	totalPending,
	avgProgress,
	avgSuccessRate,
}: {
	totalStudents: number;
	totalPending: number;
	avgProgress: number;
	avgSuccessRate: number | null;
}) {
	const { t } = useTranslation();
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
	);
}
