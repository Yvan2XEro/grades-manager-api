import { cn } from "@/lib/utils";

interface TableSkeletonProps {
	columns?: number;
	rows?: number;
	className?: string;
}

export function TableSkeleton({
	columns = 4,
	rows = 5,
	className,
}: TableSkeletonProps) {
	return (
		<div className={cn("w-full overflow-hidden rounded-lg border", className)}>
			{/* Header */}
			<div className="flex gap-4 bg-muted/50 px-4 py-3">
				{Array.from({ length: columns }).map((_, i) => (
					<div
						key={`head-${i}`}
						className="h-3 flex-1 animate-shimmer rounded"
					/>
				))}
			</div>
			{/* Rows */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div
					key={`row-${rowIndex}`}
					className="flex gap-4 border-t px-4 py-3.5"
				>
					{Array.from({ length: columns }).map((_, colIndex) => (
						<div
							key={`cell-${rowIndex}-${colIndex}`}
							className="h-3 flex-1 animate-shimmer rounded"
							style={{
								animationDelay: `${(rowIndex * columns + colIndex) * 75}ms`,
							}}
						/>
					))}
				</div>
			))}
		</div>
	);
}
