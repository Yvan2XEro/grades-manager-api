import { School } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramBar } from "../../types";

/** Bar chart: students per program. */
export function ProgramEnrollmentChart({
	data: byProgram,
}: {
	data: ProgramBar[];
}) {
	const { t } = useTranslation();
	return (
		<Card className="border-0 shadow-sm lg:col-span-3">
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
						<School className="h-4 w-4 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">
							{t("admin.dashboard.programStats.title")}
						</CardTitle>
						<p className="text-muted-foreground text-xs">
							{t("admin.dashboard.programStats.subtitle", {
								defaultValue: "Étudiants inscrits par filière",
							})}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="h-64">
					{byProgram.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={byProgram}
								margin={{ top: 4, right: 16, left: 0, bottom: 60 }}
							>
								<defs>
									<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="0%"
											stopColor="var(--primary)"
											stopOpacity={0.9}
										/>
										<stop
											offset="100%"
											stopColor="var(--primary)"
											stopOpacity={0.5}
										/>
									</linearGradient>
								</defs>
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
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									axisLine={false}
									tickLine={false}
									allowDecimals={false}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "10px",
										border: "1px solid var(--border)",
										boxShadow: "0 8px 20px -4px rgb(0 0 0 / 0.12)",
										fontSize: "13px",
										backgroundColor: "var(--card)",
									}}
									cursor={{ fill: "var(--muted)", opacity: 0.4 }}
								/>
								<Bar
									dataKey="students"
									fill="url(#barGrad)"
									radius={[6, 6, 0, 0]}
									isAnimationActive
									animationDuration={800}
									animationEasing="ease-out"
								/>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
							<School className="h-10 w-10 opacity-30" />
							<p className="text-sm">
								{t("admin.dashboard.programStats.empty")}
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
