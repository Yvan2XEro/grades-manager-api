import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceStats } from "../hooks/use-statistics";
import {
	exportFinanceStats,
	formatAmount,
} from "../services/statistics-export";
import { ChartCard } from "./chart-card";
import { ColorLegend } from "./color-legend";
import { DonutChart } from "./donut-chart";
import { MonthlyCollectionsChart } from "./monthly-collections-chart";
import { StatTabHeader } from "./stat-tab-header";

const METHOD_COLORS: Record<string, string> = {
	cash: "var(--chart-1)",
	bank_transfer: "var(--chart-2)",
	mobile_money: "var(--chart-3)",
	check: "var(--chart-4)",
	bank_import: "var(--chart-5)",
};

export function StatisticsFinancesTab({ yearId }: { yearId: string | null }) {
	const { t } = useTranslation();
	const { data, isLoading } = useFinanceStats(yearId);

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const kpis = [
		{
			label: t("admin.statistics.finances.expected"),
			value: formatAmount(data?.expected ?? 0),
			color: "text-foreground",
		},
		{
			label: t("admin.statistics.finances.collected"),
			value: formatAmount(data?.collected ?? 0),
			color: "text-green-600 dark:text-green-400",
		},
		{
			label: t("admin.statistics.finances.outstanding"),
			value: formatAmount(data?.outstanding ?? 0),
			color: "text-destructive",
		},
		{
			label: t("admin.statistics.finances.collectionRate"),
			value: `${data?.collectionRate ?? 0}%`,
			color: "text-primary",
		},
	];
	const byMethod = (data?.byPaymentMethod ?? []).map((m) => ({
		name: t(`admin.statistics.finances.method.${m.method}`, {
			defaultValue: m.method,
		}),
		value: m.total,
		count: m.count,
		color: METHOD_COLORS[m.method] ?? "var(--chart-5)",
	}));
	const monthly = (data?.monthlyCollections ?? []).map((m) => ({
		month: m.month,
		montant: m.total,
	}));

	return (
		<div className="space-y-5">
			<StatTabHeader onExport={() => data && exportFinanceStats(data, t)}>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
						<Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<p className="font-semibold text-lg">
						{t("admin.statistics.finances.title")}
					</p>
				</div>
			</StatTabHeader>

			{/* KPI cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{kpis.map((kpi) => (
					<Card key={kpi.label}>
						<CardContent className="pt-4">
							<p className="text-muted-foreground text-xs">{kpi.label}</p>
							<p className={`mt-1 font-bold text-lg tabular-nums ${kpi.color}`}>
								{kpi.value}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Collection rate progress bar */}
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{t("admin.statistics.finances.collected")}
						</span>
						<span className="font-medium">{data?.collectionRate ?? 0}%</span>
					</div>
					<div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-green-500 transition-all duration-700"
							style={{
								width: `${Math.min(data?.collectionRate ?? 0, 100)}%`,
							}}
						/>
					</div>
					<div className="mt-1 flex justify-between text-muted-foreground text-xs">
						<span>{formatAmount(data?.collected ?? 0)}</span>
						<span>{formatAmount(data?.expected ?? 0)}</span>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-5 lg:grid-cols-5">
				<ChartCard
					className="lg:col-span-3"
					title={t("admin.statistics.finances.monthlyTrend")}
					isEmpty={monthly.length === 0}
				>
					<MonthlyCollectionsChart
						monthly={monthly}
						collectedLabel={t("admin.statistics.finances.collected")}
					/>
				</ChartCard>

				<ChartCard
					className="lg:col-span-2"
					title={t("admin.statistics.finances.byMethod")}
					isEmpty={byMethod.length === 0}
				>
					<DonutChart
						data={byMethod}
						formatter={(v: number) => [formatAmount(v), ""]}
					/>
					<ColorLegend items={byMethod} small renderValue={formatAmount} />
				</ChartCard>
			</div>
		</div>
	);
}
