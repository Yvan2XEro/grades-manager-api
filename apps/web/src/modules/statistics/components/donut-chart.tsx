import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartDatum } from "../types";
import { tooltipStyle } from "./chart-styles";

/** Donut of colored slices; size given by the wrapper class. */
export function DonutChart({
	data,
	className = "h-36",
	innerRadius = 35,
	outerRadius = 55,
	formatter,
}: {
	data: ChartDatum[];
	className?: string;
	innerRadius?: number;
	outerRadius?: number;
	formatter?: (value: number) => [string, string];
}) {
	return (
		<div className={className}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						dataKey="value"
						paddingAngle={2}
					>
						{data.map((d) => (
							<Cell key={d.name} fill={d.color} />
						))}
					</Pie>
					<Tooltip contentStyle={tooltipStyle} formatter={formatter} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
