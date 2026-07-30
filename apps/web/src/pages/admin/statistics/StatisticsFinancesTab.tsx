import { useQuery } from "@tanstack/react-query";
import { Download, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatAmount(n: number) {
	return `${new Intl.NumberFormat("fr-FR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n)} XAF`;
}

const METHOD_COLORS: Record<string, string> = {
	cash: "var(--chart-1)",
	bank_transfer: "var(--chart-2)",
	mobile_money: "var(--chart-3)",
	check: "var(--chart-4)",
	bank_import: "var(--chart-5)",
};

export function StatisticsFinancesTab({ yearId }: { yearId: string | null }) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(
		trpc.stats.financeStats.queryOptions({
			academicYearId: yearId ?? undefined,
		}),
	);

	function handleExport() {
		if (!data) return;
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet([
				{
					Indicateur: t("admin.statistics.finances.expected"),
					Montant: data.expected,
				},
				{
					Indicateur: t("admin.statistics.finances.collected"),
					Montant: data.collected,
				},
				{
					Indicateur: t("admin.statistics.finances.outstanding"),
					Montant: data.outstanding,
				},
				{
					Indicateur: t("admin.statistics.finances.collectionRate"),
					Montant: `${data.collectionRate}%`,
				},
			]),
			"Vue d'ensemble",
		);
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.monthlyCollections.map((m) => ({
					Mois: m.month,
					Montant: m.total,
				})),
			),
			"Mensuel",
		);
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.byPaymentMethod.map((m) => ({
					Méthode: m.method,
					Montant: m.total,
					Transactions: m.count,
				})),
			),
			"Par méthode",
		);
		XLSX.writeFile(wb, "statistiques-finances.xlsx");
	}

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
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
						<Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<p className="font-semibold text-lg">
						{t("admin.statistics.finances.title")}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					className="gap-2"
				>
					<Download className="h-4 w-4" />
					{t("admin.statistics.export")}
				</Button>
			</div>

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
				{/* Area chart: monthly collections */}
				<Card className="lg:col-span-3">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.finances.monthlyTrend")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{monthly.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noData")}
							</p>
						) : (
							<div className="h-48">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart
										data={monthly}
										margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
									>
										<defs>
											<linearGradient
												id="collectGrad"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="var(--chart-2)"
													stopOpacity={0.3}
												/>
												<stop
													offset="95%"
													stopColor="var(--chart-2)"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="month"
											tick={{
												fontSize: 11,
												fill: "var(--muted-foreground)",
											}}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{
												fontSize: 11,
												fill: "var(--muted-foreground)",
											}}
											axisLine={false}
											tickLine={false}
											tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: "10px",
												border: "1px solid var(--border)",
												fontSize: "13px",
												backgroundColor: "var(--card)",
											}}
											formatter={(v: number) => [
												formatAmount(v),
												t("admin.statistics.finances.collected"),
											]}
										/>
										<Area
											type="monotone"
											dataKey="montant"
											stroke="var(--chart-2)"
											strokeWidth={2}
											fill="url(#collectGrad)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Donut: by payment method */}
				<Card className="lg:col-span-2">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.finances.byMethod")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{byMethod.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noData")}
							</p>
						) : (
							<>
								<div className="h-36">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={byMethod}
												cx="50%"
												cy="50%"
												innerRadius={35}
												outerRadius={55}
												dataKey="value"
												paddingAngle={2}
											>
												{byMethod.map((m) => (
													<Cell key={m.name} fill={m.color} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													borderRadius: "10px",
													border: "1px solid var(--border)",
													fontSize: "13px",
													backgroundColor: "var(--card)",
												}}
												formatter={(v: number) => [formatAmount(v), ""]}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="space-y-1.5">
									{byMethod.map((m) => (
										<div
											key={m.name}
											className="flex items-center justify-between text-xs"
										>
											<div className="flex items-center gap-2">
												<span
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: m.color }}
												/>
												<span className="text-muted-foreground">{m.name}</span>
											</div>
											<span className="font-medium tabular-nums">
												{formatAmount(m.value)}
											</span>
										</div>
									))}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
