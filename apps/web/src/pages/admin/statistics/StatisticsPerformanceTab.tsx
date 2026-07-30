import { useQuery } from "@tanstack/react-query";
import { Download, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DECISION_COLORS: Record<string, string> = {
	passed: "var(--chart-2)",
	failed: "var(--chart-4)",
	repeating: "var(--chart-3)",
	excluded: "var(--destructive)",
	deferred: "var(--chart-5)",
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
	const { data, isLoading } = useQuery(
		trpc.stats.performanceStats.queryOptions({
			academicYearId: yearId ?? undefined,
		}),
	);

	function handleExport() {
		if (!data) return;
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.byDecision.map((d) => ({
					Décision: d.decision ?? "N/A",
					Étudiants: d.count,
				})),
			),
			"Par décision",
		);
		XLSX.utils.book_append_sheet(
			wb,
			XLSX.utils.json_to_sheet(
				data.byMention.map((m) => ({
					Mention: m.mention ?? "N/A",
					Étudiants: m.count,
				})),
			),
			"Par mention",
		);
		XLSX.writeFile(wb, "statistiques-performance.xlsx");
	}

	if (isLoading) return <Skeleton className="h-96 w-full" />;

	const byDecision = (data?.byDecision ?? []).map((d) => ({
		name: t(
			`admin.statistics.performance.decision.${d.decision ?? "unknown"}`,
			{ defaultValue: d.decision ?? "N/A" },
		),
		value: d.count,
		color: DECISION_COLORS[d.decision ?? ""] ?? "var(--chart-5)",
	}));
	const byMention = (data?.byMention ?? []).map((m, i) => ({
		name: t(`admin.statistics.performance.mention.${m.mention ?? "unknown"}`, {
			defaultValue: m.mention ?? "N/A",
		}),
		value: m.count,
		color: MENTION_COLORS[i % MENTION_COLORS.length],
	}));
	const avg = data?.avgGeneralAverage ?? 0;
	const total = byDecision.reduce((s, d) => s + d.value, 0);

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<GraduationCap className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="font-bold text-2xl tabular-nums">
								{total.toLocaleString()}
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.statistics.performance.studentsDeliberated")}
							</p>
						</div>
					</div>
					{avg > 0 && (
						<div>
							<p className="font-bold text-2xl tabular-nums">
								{avg.toFixed(2)}/20
							</p>
							<p className="text-muted-foreground text-sm">
								{t("admin.statistics.performance.avgGeneral")}
							</p>
						</div>
					)}
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

			<div className="grid gap-5 lg:grid-cols-2">
				{/* Donut: by decision */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.performance.byDecision")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{byDecision.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noDeliberations")}
							</p>
						) : (
							<div className="flex gap-4">
								<div className="h-48 w-48 shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={byDecision}
												cx="50%"
												cy="50%"
												innerRadius={40}
												outerRadius={70}
												dataKey="value"
												paddingAngle={2}
											>
												{byDecision.map((d) => (
													<Cell key={d.name} fill={d.color} />
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
								<div className="flex flex-1 flex-col justify-center gap-2">
									{byDecision.map((d) => (
										<div
											key={d.name}
											className="flex items-center justify-between text-sm"
										>
											<div className="flex items-center gap-2">
												<span
													className="h-2.5 w-2.5 rounded-full"
													style={{ backgroundColor: d.color }}
												/>
												<span className="text-muted-foreground">{d.name}</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="font-semibold tabular-nums">
													{d.value}
												</span>
												{total > 0 && (
													<span className="text-muted-foreground text-xs">
														({Math.round((d.value / total) * 100)}%)
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Mention breakdown */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">
							{t("admin.statistics.performance.byMention")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{byMention.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								{t("admin.statistics.noMentions")}
							</p>
						) : (
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
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
