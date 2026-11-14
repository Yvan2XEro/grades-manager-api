import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatAmount } from "../services/statistics-export";
import { axisTick, tooltipStyle } from "./chart-styles";

/** Collected amount per month. */
export function MonthlyCollectionsChart({
	monthly,
	collectedLabel,
}: {
	monthly: Array<{ month: string; montant: number }>;
	collectedLabel: string;
}) {
	return (
		<div className="h-48">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={monthly}
					margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
				>
					<defs>
						<linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
							<stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="var(--border)"
					/>
					<XAxis
						dataKey="month"
						tick={axisTick}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={axisTick}
						axisLine={false}
						tickLine={false}
						tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
					/>
					<Tooltip
						contentStyle={tooltipStyle}
						formatter={(v: number) => [formatAmount(v), collectedLabel]}
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
	);
}
