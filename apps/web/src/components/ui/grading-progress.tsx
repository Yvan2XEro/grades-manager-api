import { cn } from "@/lib/utils";
import { Progress } from "./progress";

interface GradingProgressProps {
	graded: number;
	total: number;
	showMissing?: boolean;
	onShowMissing?: () => void;
	className?: string;
}

export function GradingProgress({
	graded,
	total,
	showMissing = false,
	onShowMissing,
	className,
}: GradingProgressProps) {
	const percentage = total > 0 ? Math.round((graded / total) * 100) : 0;
	const missing = total - graded;
	const isComplete = graded >= total && total > 0;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Progress
				value={percentage}
				className={cn("h-1.5 flex-1", isComplete && "[&>div]:bg-emerald-500")}
			/>
			<span className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
				{graded} / {total}
			</span>
			{showMissing && missing > 0 && onShowMissing && (
				<button
					type="button"
					onClick={onShowMissing}
					className="whitespace-nowrap text-muted-foreground text-xs underline underline-offset-2 transition-colors hover:text-foreground"
				>
					{missing} manquant{missing > 1 ? "s" : ""}
				</button>
			)}
		</div>
	);
}
