import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { axisTick, tooltipStyle } from "./chart-styles";

/** Vertical bars with slanted program names. */
export function ProgramBarChart({
	data,
}: {
	data: Array<{ name: string; value: number }>;
}) {
	return (
		<div className="h-64">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
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
						tick={axisTick}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={axisTick}
						axisLine={false}
						tickLine={false}
						allowDecimals={false}
					/>
					<Tooltip contentStyle={tooltipStyle} />
					<Bar
						dataKey="value"
						fill="var(--primary)"
						radius={[6, 6, 0, 0]}
						opacity={0.85}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
