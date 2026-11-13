import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Bar,
	BarChart,
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

const STATUS_COLORS: Record<string, string> = {
	draft: "var(--chart-5)",
	submitted: "var(--chart-3)",
	pending: "var(--chart-3)",
	approved: "var(--chart-2)",
	rejected: "var(--destructive)",
	waitlisted: "var(--chart-4)",
	enrolled: "var(--chart-1)",
};

export function StatisticsAdmissionsTab({ yearId }: { yearId: string | null }) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery(
		trpc.stats.admissionsStats.queryOptions({
			academicYearId: yearId ?? undefined,
		}),
	);

	function handleExport() {
		if (!data) return;
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.byStatus.map((s) => ({
					Statut: s.status,
					Candidatures: s.count,
				})),
			),
			"Par statut",
		);
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.byProgram.map((p) => ({
					Programme: p.programName,
					Candidatures: p.count,
				})),
			),
			"Par programme",
		);
		XLSX.writeFile(wb, "statistiques-admissions.xlsx");
	}

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const total = data?.total ?? 0;
	const converted = data?.converted ?? 0;
	const conversionRate = data?.conversionRate ?? 0;
	const byStatus = (data?.byStatus ?? [])
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: t(`admin.statistics.admissions.status.${s.status}`, {
				defaultValue: s.status,
			}),
			value: s.count,
			color: STATUS_COLORS[s.status] ?? "var(--chart-5)",
		}));
	const byProgram = (data?.byProgram ?? []).map((p) => ({
		name: p.programName,
		value: p.count,
	}));

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div className="flex flex-wrap items-center gap-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<ClipboardList className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="font-bold text-2xl tabular-nums">
								{total.toLocaleString()}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.statistics.admissions.total")}
							</p>
						</div>
					</div>
					<div>
						<p className="font-bold text-2xl tabular-nums">{conversionRate}%</p>
						<p className="text-muted-foreground text-sm">
							{t("admin.statistics.admissions.conversionRate")}
						</p>
					</div>
					<div>
						<p className="font-bold text-2xl tabular-nums">
							{converted.toLocaleString()}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("admin.statistics.admissions.converted")}
						</p>
					</div>
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

			<div className="grid gap-5 lg:grid-cols-5">
				{/* Bar: by program */}
				<Card className="lg:col-span-3">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.admissions.byProgram")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{byProgram.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noData")}
							</p>
						) : (
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={byProgram}
										margin={{ top: 4, right: 16, left: 0, bottom: 60 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="name"
											angle={-35}
											textAnchor="end"
											height={70}
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
											allowDecimals={false}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: "10px",
												border: "1px solid var(--border)",
												fontSize: "13px",
												backgroundColor: "var(--card)",
											}}
										/>
										<Bar
											dataKey="value"
											fill="var(--primary)"
											radius={[6, 6, 0, 0]}
											opacity={0.85}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Donut: by status */}
				<Card className="lg:col-span-2">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.admissions.byStatus")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{byStatus.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noData")}
							</p>
						) : (
							<>
								<div className="h-36">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={byStatus}
												cx="50%"
												cy="50%"
												innerRadius={35}
												outerRadius={55}
												dataKey="value"
												paddingAngle={2}
											>
												{byStatus.map((s) => (
													<Cell key={s.name} fill={s.color} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													borderRadius: "10px",
													border: "1px solid var(--border)",
													fontSize: "13px",
													backgroundColor: "var(--card)",
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="space-y-1.5">
									{byStatus.map((s) => (
										<div
											key={s.name}
											className="flex items-center justify-between text-sm"
										>
											<div className="flex items-center gap-2">
												<span
													className="h-2.5 w-2.5 rounded-full"
													style={{ backgroundColor: s.color }}
												/>
												<span className="text-muted-foreground">{s.name}</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="font-semibold tabular-nums">
													{s.value}
												</span>
												{total > 0 && (
													<span className="text-muted-foreground text-xs">
														({Math.round((s.value / total) * 100)}
														%)
													</span>
												)}
											</div>
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
