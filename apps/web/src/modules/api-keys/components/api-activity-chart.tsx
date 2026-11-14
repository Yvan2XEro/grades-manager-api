import { useTranslation } from "react-i18next";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiKeySeries } from "../types";

const SERIES_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

const tick = { fontSize: 10, fill: "var(--muted-foreground)" };

interface ApiActivityChartProps {
	title: string;
	emptyText: string;
	series: ApiKeySeries;
	/** Prefix of the SVG gradient ids; must be unique on the page. */
	gradientPrefix: string;
}

/** Stacked daily activity per API key over the last 30 days. */
export function ApiActivityChart({
	title,
	emptyText,
	series: { labelMap, keyIds, chartData },
	gradientPrefix,
}: ApiActivityChartProps) {
	const { t } = useTranslation();
	const keyLabel = (keyId: string) =>
		labelMap.get(keyId) ??
		t("admin.apiKeys.activity.unknownKey", {
			defaultValue: "Sans clé",
		});

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{keyIds.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{emptyText}
					</p>
				) : (
					<div className="h-52">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={chartData}
								margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
							>
								<defs>
									{keyIds.map((keyId, i) => (
										<linearGradient
											key={keyId}
											id={`${gradientPrefix}-${i}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
												stopOpacity={0.3}
											/>
											<stop
												offset="95%"
												stopColor={SERIES_COLORS[i % SERIES_COLORS.length]}
												stopOpacity={0.02}
											/>
										</linearGradient>
									))}
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="var(--border)"
								/>
								<XAxis
									dataKey="date"
									tick={tick}
									axisLine={false}
									tickLine={false}
									interval="preserveStartEnd"
								/>
								<YAxis
									allowDecimals={false}
									tick={tick}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "8px",
										border: "1px solid var(--border)",
										backgroundColor: "var(--card)",
										fontSize: "12px",
										color: "var(--foreground)",
									}}
								/>
								<Legend
									formatter={(value) => keyLabel(value)}
									wrapperStyle={{ fontSize: "11px" }}
								/>
								{keyIds.map((keyId, i) => (
									<Area
										key={keyId}
										type="monotone"
										dataKey={keyId}
										name={keyLabel(keyId)}
										stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
										fill={`url(#${gradientPrefix}-${i})`}
										strokeWidth={2}
										dot={false}
										activeDot={{ r: 4 }}
									/>
								))}
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
