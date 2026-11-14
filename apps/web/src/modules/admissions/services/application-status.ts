/** Badge colors of the application statuses (`converted` = turned into a student). */
export const APPLICATION_STATUS_COLORS: Record<string, string> = {
	submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	under_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
	waitlisted: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
	converted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

/** Statuses offered by the list filter, in workflow order. */
export const APPLICATION_STATUSES = [
	"submitted",
	"under_review",
	"accepted",
	"waitlisted",
	"rejected",
] as const;

/** Applications still waiting for a decision. */
export const isAwaitingDecision = (status: string) =>
	["submitted", "under_review"].includes(status);
