import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUSES } from "../types";
import { AssignmentStatusBadge } from "./status-badges";

/** One clickable count per status; clicking toggles the status filter. */
export function AssignmentStatusSummary({
	counts,
	activeStatus,
	onToggle,
}: {
	counts: Record<string, number>;
	activeStatus: string;
	onToggle: (status: string) => void;
}) {
	return (
		<div className="grid grid-cols-4 gap-3">
			{ASSIGNMENT_STATUSES.map((s) => (
				<button
					key={s}
					type="button"
					onClick={() => onToggle(activeStatus === s ? "" : s)}
					className={cn(
						"rounded-lg border p-3 text-left transition-colors",
						activeStatus === s
							? "border-primary bg-primary/5"
							: "hover:bg-muted/50",
					)}
				>
					<div className="flex items-center gap-1">
						<AssignmentStatusBadge status={s} withIcon />
					</div>
					<p className="mt-1 font-bold text-xl">{counts[s] ?? 0}</p>
				</button>
			))}
		</div>
	);
}
