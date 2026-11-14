type BadgeVariant =
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "success"
	| "warning";

export const DELIBERATION_STATUSES = [
	"draft",
	"open",
	"closed",
	"signed",
] as const;
export const DELIBERATION_TYPES = ["semester", "annual", "retake"] as const;
export type DeliberationType = (typeof DELIBERATION_TYPES)[number];

/** Final decisions a jury can pronounce (rules, overrides). */
export const DELIBERATION_DECISIONS = [
	"admitted",
	"compensated",
	"deferred",
	"repeat",
	"excluded",
] as const;
export type DeliberationDecision = (typeof DELIBERATION_DECISIONS)[number];

export const statusVariants: Record<string, BadgeVariant> = {
	draft: "secondary",
	open: "default",
	closed: "outline",
	signed: "success",
};

export const decisionVariants: Record<string, BadgeVariant> = {
	admitted: "default",
	compensated: "secondary",
	deferred: "outline",
	repeat: "destructive",
	excluded: "destructive",
	pending: "outline",
};

export const ueDecisionVariants: Record<string, BadgeVariant> = {
	ADM: "default",
	CMP: "secondary",
	AJ: "destructive",
	INC: "outline",
};
