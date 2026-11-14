import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Deliberation } from "../types";

function StatCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: string | number;
	accent?: boolean;
}) {
	return (
		<div className="rounded-xl border bg-card p-5 shadow-sm">
			<p className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</p>
			<p
				className={cn("mt-1 font-bold text-2xl", accent && "text-emerald-600")}
			>
				{value}
			</p>
		</div>
	);
}

/** Totals of a deliberation: students, success rate, class average, admitted. */
export function DeliberationStatsCards({
	stats,
}: {
	stats: NonNullable<Deliberation["stats"]>;
}) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-4 md:grid-cols-4">
			<StatCard
				label={t("admin.deliberations.detail.totalStudents")}
				value={stats.totalStudents ?? 0}
			/>
			<StatCard
				label={t("admin.deliberations.detail.successRate")}
				value={
					stats.successRate != null
						? `${(stats.successRate * 100).toFixed(1)}%`
						: "—"
				}
				accent
			/>
			<StatCard
				label={t("admin.deliberations.detail.classAverage")}
				value={
					stats.classAverage != null
						? Number(stats.classAverage).toFixed(2)
						: "—"
				}
			/>
			<StatCard
				label={t("admin.deliberations.decision.admitted")}
				value={stats.decisionCounts?.admitted ?? 0}
				accent
			/>
		</div>
	);
}
