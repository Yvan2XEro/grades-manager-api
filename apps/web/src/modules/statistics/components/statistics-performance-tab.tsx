import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/number-format";
import { usePerformanceStats } from "../hooks/use-statistics";
import { exportPerformanceStats } from "../services/statistics-export";
import { ChartCard } from "./chart-card";
import { ColorLegend } from "./color-legend";
import { DonutChart } from "./donut-chart";
import { StatFigure, StatTabHeader } from "./stat-tab-header";

const DECISION_COLORS: Record<string, string> = {
	admitted: "var(--chart-2)",
	compensated: "var(--chart-1)",
	deferred: "var(--chart-5)",
	repeat: "var(--chart-3)",
	excluded: "var(--destructive)",
	pending: "var(--chart-4)",
};
const MENTION_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function StatisticsPerformanceTab({
	yearId,
}: {
	yearId: string | null;
}) {
	const { t } = useTranslation();
	const { data, isLoading } = usePerformanceStats(yearId);

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const byDecision = (data?.byDecision ?? []).map((d) => ({
		name: t(`admin.deliberations.decision.${d.decision ?? "pending"}`),
		value: d.count,
		color: DECISION_COLORS[d.decision ?? ""] ?? "var(--chart-5)",
	}));
	const byMention = (data?.byMention ?? []).map((m, i) => ({
		name: m.mention
			? t(`admin.deliberations.mention.${m.mention}`)
			: t("admin.statistics.performance.mention.unknown"),
		value: m.count,
		color: MENTION_COLORS[i % MENTION_COLORS.length],
	}));
	const avg = data?.avgGeneralAverage ?? 0;
	const total = byDecision.reduce((s, d) => s + d.value, 0);
	// Same definition as the deliberation page and the dean dashboard
	const passed = (data?.byDecision ?? [])
		.filter((d) => d.decision === "admitted" || d.decision === "compensated")
		.reduce((s, d) => s + d.count, 0);

	return (
		<div className="space-y-5">
			<StatTabHeader onExport={() => data && exportPerformanceStats(data)}>
				<div className="flex items-center gap-6">
					<StatFigure
						icon={GraduationCap}
						value={total.toLocaleString()}
						label={t("admin.statistics.performance.studentsDeliberated")}
					/>
					{total > 0 && (
						<StatFigure
							value={formatPercent(passed / total)}
							label={t("admin.statistics.performance.passRate")}
							hint={t("admin.statistics.performance.passRateHint")}
						/>
					)}
					{avg > 0 && (
						<StatFigure
							value={`${avg.toFixed(2)}/20`}
							label={t("admin.statistics.performance.avgGeneral")}
						/>
					)}
				</div>
			</StatTabHeader>

			<div className="grid gap-5 lg:grid-cols-2">
				<ChartCard
					title={t("admin.statistics.performance.byDecision")}
					isEmpty={byDecision.length === 0}
					emptyText={t("admin.statistics.noDeliberations")}
				>
					<div className="flex gap-4">
						<DonutChart
							data={byDecision}
							className="h-48 w-48 shrink-0"
							innerRadius={40}
							outerRadius={70}
						/>
						<ColorLegend
							items={byDecision}
							total={total}
							className="flex flex-1 flex-col justify-center gap-2"
						/>
					</div>
				</ChartCard>

				<ChartCard
					title={t("admin.statistics.performance.byMention")}
					isEmpty={byMention.length === 0}
					emptyText={t("admin.statistics.noMentions")}
				>
					<div className="space-y-3">
						{byMention.map((m) => (
							<div key={m.name} className="flex items-center gap-3">
								<span
									className="h-2.5 w-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: m.color }}
								/>
								<div className="flex flex-1 items-center justify-between">
									<span className="text-muted-foreground text-sm">
										{m.name}
									</span>
									<span className="font-semibold text-sm tabular-nums">
										{m.value}
									</span>
								</div>
								<div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full transition-all duration-700"
										style={{
											backgroundColor: m.color,
											width: `${total > 0 ? Math.round((m.value / total) * 100) : 0}%`,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</ChartCard>
			</div>
		</div>
	);
}
