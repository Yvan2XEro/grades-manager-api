import { Progress } from "@/components/ui/progress";

/** "<label> done / total" with the OK / failure counts and a progress bar. */
export function GenerationProgress({
	label,
	progress,
	summary,
	className,
}: {
	label: string;
	progress: { done: number; total: number };
	summary: { ok: number; error: number };
	className?: string;
}) {
	return (
		<div className={className}>
			<div className="flex items-center justify-between text-sm">
				<span>
					{label} {progress.done} / {progress.total}
				</span>
				<span className="text-muted-foreground">
					{summary.ok} OK · {summary.error} échec(s)
				</span>
			</div>
			<Progress
				value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0}
			/>
		</div>
	);
}
