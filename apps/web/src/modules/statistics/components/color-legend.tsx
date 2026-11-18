import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ChartDatum } from "../types";

/**
 * Legend of a chart: colored dot, name and value; with `total`, the share of
 * each item is added.
 */
export function ColorLegend({
	items,
	total,
	className = "space-y-1.5",
	small,
	renderValue,
}: {
	items: ChartDatum[];
	total?: number;
	className?: string;
	/** Smaller text and dots (finances). */
	small?: boolean;
	renderValue?: (value: number) => ReactNode;
}) {
	return (
		<div className={className}>
			{items.map((item) => (
				<div
					key={item.name}
					className={cn(
						"flex items-center justify-between",
						small ? "text-xs" : "text-sm",
					)}
				>
					<div className="flex items-center gap-2">
						<span
							className={cn("rounded-full", small ? "h-2 w-2" : "h-2.5 w-2.5")}
							style={{ backgroundColor: item.color }}
						/>
						<span className="text-muted-foreground">{item.name}</span>
					</div>
					{total !== undefined ? (
						<div className="flex items-center gap-2">
							<span className="font-semibold tabular-nums">{item.value}</span>
							{total > 0 && (
								<span className="text-muted-foreground text-xs">
									({Math.round((item.value / total) * 100)}%)
								</span>
							)}
						</div>
					) : (
						<span
							className={cn(
								"tabular-nums",
								small ? "font-medium" : "font-semibold",
							)}
						>
							{renderValue ? renderValue(item.value) : item.value}
						</span>
					)}
				</div>
			))}
		</div>
	);
}
