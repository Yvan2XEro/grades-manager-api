import { CheckCircle2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusSlice } from "../../types";

const RADIAN = Math.PI / 180;

const renderPieLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}: {
	cx: number;
	cy: number;
	midAngle: number;
	innerRadius: number;
	outerRadius: number;
	percent: number;
}) => {
	if (percent < 0.05) return null;
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);
	return (
		<text
			x={x}
			y={y}
			fill="white"
			textAnchor="middle"
			dominantBaseline="central"
			fontSize={12}
			fontWeight={600}
		>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

/** Donut chart: enrollments per status. */
export function EnrollmentStatusChart({
	data: byStatus,
}: {
	data: StatusSlice[];
}) {
	return (
		<Card className="border-0 shadow-sm lg:col-span-2">
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
						<CheckCircle2 className="h-4 w-4 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">Statut des inscriptions</CardTitle>
						<p className="text-muted-foreground text-xs">
							Répartition par état
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{byStatus.length > 0 ? (
					<div className="space-y-4">
						<div className="h-48">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={byStatus}
										cx="50%"
										cy="50%"
										innerRadius={45}
										outerRadius={75}
										dataKey="value"
										labelLine={false}
										label={renderPieLabel}
										isAnimationActive
										animationDuration={800}
										animationEasing="ease-out"
									>
										{byStatus.map((entry) => (
											<Cell key={entry.name} fill={entry.color} />
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
						<div className="space-y-2">
							{byStatus.map((entry) => (
								<div
									key={entry.name}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<span
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: entry.color }}
										/>
										<span className="text-muted-foreground text-xs">
											{entry.name}
										</span>
									</div>
									<span className="font-semibold text-foreground text-sm tabular-nums">
										{entry.value.toLocaleString()}
									</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
						<CheckCircle2 className="h-10 w-10 opacity-30" />
						<p className="text-sm">Aucune inscription</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
