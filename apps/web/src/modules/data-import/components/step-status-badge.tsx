import { Badge } from "@/components/ui/badge";
import type { StepStatus } from "../types";

const LABELS: Record<StepStatus, string> = {
	done: "Fait",
	skipped: "Passé",
	todo: "À faire",
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
	return (
		<Badge
			variant="outline"
			className={
				status === "done"
					? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
					: status === "skipped"
						? "text-muted-foreground"
						: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
			}
		>
			{LABELS[status]}
		</Badge>
	);
}
