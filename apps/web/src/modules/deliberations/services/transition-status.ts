import type {
	ItemStatus,
	Summary,
	Transition,
	TransitionListItem,
	TransitionOutcome,
	TransitionStatus,
} from "../types";

export const outcomeTabs: Array<TransitionOutcome | "all"> = [
	"all",
	"review",
	"promote",
	"repeat",
	"graduate",
	"exclude",
];

export const itemStatusFilters: Array<ItemStatus | "all"> = [
	"all",
	"blocked",
	"ready",
	"succeeded",
	"failed",
];

/** Outcomes a blocked item can be resolved to. */
export const RESOLVE_OUTCOMES = [
	"promote",
	"repeat",
	"graduate",
	"exclude",
	"transfer",
	"suspend",
] as const;

/** Statuses after which a transition plan can no longer change. */
export const TERMINAL_STATUSES = [
	"completed",
	"completed_with_errors",
	"stale",
	"cancelled",
];

export function summaryOf(
	transition?: Pick<Transition | TransitionListItem, "summary"> | null,
): Summary {
	return (transition?.summary ?? {}) as Summary;
}

export function count(summary: Summary, key: string) {
	return summary[key] ?? 0;
}

export function statusVariant(status: TransitionStatus | ItemStatus) {
	if (["completed", "succeeded", "ready", "approved"].includes(status))
		return "success" as const;
	if (["draft", "pending_approval", "running", "processing"].includes(status))
		return "warning" as const;
	if (["blocked", "failed", "cancelled", "stale"].includes(status))
		return "destructive" as const;
	return "secondary" as const;
}

export function outcomeVariant(outcome: TransitionOutcome) {
	if (outcome === "promote" || outcome === "graduate")
		return "success" as const;
	if (outcome === "repeat" || outcome === "review") return "warning" as const;
	if (outcome === "exclude") return "destructive" as const;
	return "secondary" as const;
}

export function formatDate(value: Date | string | null | undefined) {
	if (!value) return "-";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export const TRANSITION_STEPS = [
	{ key: "draft", labelKey: "admin.academicYearTransitions.step.draft" },
	{
		key: "pending_approval",
		labelKey: "admin.academicYearTransitions.step.pendingApproval",
	},
	{
		key: "approved",
		labelKey: "admin.academicYearTransitions.step.approved",
	},
	{ key: "running", labelKey: "admin.academicYearTransitions.step.running" },
	{
		key: "completed",
		labelKey: "admin.academicYearTransitions.step.completed",
	},
] as const;

export function stepStatusFor(status: TransitionStatus): string {
	if (["draft", "ready"].includes(status)) return "draft";
	if (["completed", "completed_with_errors"].includes(status))
		return "completed";
	return status;
}
