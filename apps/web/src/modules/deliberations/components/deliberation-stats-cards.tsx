import { useTranslation } from "react-i18next";
import { formatDecimal, formatPercent } from "@/lib/number-format";
import { cn } from "@/lib/utils";
import type { Deliberation } from "../types";

function StatCard({
	label,
	value,
	hint,
	accent,
}: {
	label: string;
	value: string | number;
	/** Small line under the value, e.g. how a rate is computed. */
	hint?: string;
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
			{hint && <p className="mt-1 text-muted-foreground text-xs">{hint}</p>}
		</div>
	);
}

/**
 * Totals of a deliberation: students, admitted, compensated, pass rate and
 * class average. The pass rate counts admitted + compensated students, which
 * the tile says, so it matches the two count tiles next to it.
 */
export function DeliberationStatsCards({
	stats,
}: {
	stats: NonNullable<Deliberation["stats"]>;
}) {
	const { t } = useTranslation();
	const total = stats.totalStudents ?? 0;
	const admitted = stats.admittedCount ?? 0;
	const compensated = stats.compensatedCount ?? 0;
	const passed = admitted + compensated;
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
			<StatCard
				label={t("admin.deliberations.detail.totalStudents")}
				value={total}
			/>
			<StatCard
				label={t("admin.deliberations.detail.admittedCount")}
				value={admitted}
				accent
			/>
			<StatCard
				label={t("admin.deliberations.detail.compensatedCount")}
				value={compensated}
			/>
			<StatCard
				label={t("admin.deliberations.detail.successRate")}
				value={total > 0 ? formatPercent(passed / total) : "—"}
				hint={t("admin.deliberations.detail.successRateHint", {
					passed,
					total,
				})}
				accent
			/>
			<StatCard
				label={t("admin.deliberations.detail.classAverage")}
				value={
					stats.classAverage != null
						? formatDecimal(Number(stats.classAverage), 2)
						: "—"
				}
			/>
		</div>
	);
}
