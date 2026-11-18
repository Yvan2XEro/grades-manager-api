/** Colour of the end-of-year projection bar for a success rate (%). */
export function projectionBarColor(rate: number | null) {
	if (rate === null) return "bg-muted";
	if (rate >= 80) return "bg-emerald-500";
	if (rate >= 50) return "bg-violet-500";
	return "bg-amber-500";
}

/** Badge colours of an average out of 20. */
export function scoreBadge(avg: number) {
	if (avg >= 16)
		return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30";
	if (avg >= 12)
		return "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30";
	if (avg >= 10)
		return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30";
	return "text-destructive bg-destructive/10";
}
