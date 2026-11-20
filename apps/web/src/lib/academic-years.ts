/**
 * Academic years for a select: most recent first (by start date), so the
 * year one works on is at the top whatever order the server returns.
 */
export function sortYearsRecentFirst<
	T extends { startDate?: string | Date | null; name?: string | null },
>(years: readonly T[]): T[] {
	const time = (y: T) => (y.startDate ? new Date(y.startDate).getTime() : 0);
	return [...years].sort(
		(a, b) => time(b) - time(a) || (b.name ?? "").localeCompare(a.name ?? ""),
	);
}
