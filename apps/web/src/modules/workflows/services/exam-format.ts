/** "12 janv. 2026" — the date format of the approval screens. */
export function formatShortDate(date: Date | string | null | undefined) {
	return date
		? new Date(date).toLocaleDateString("fr-FR", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		: null;
}

export function formatDateTime(date: Date | string) {
	return new Date(date).toLocaleString("fr-FR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Average / min / max (2 decimals) and number of failing scores. */
export function computeGradeStats(scores: number[]) {
	const graded = scores.length;
	return {
		avg:
			graded > 0
				? (scores.reduce((s, v) => s + v, 0) / graded).toFixed(2)
				: null,
		min: graded > 0 ? Math.min(...scores).toFixed(2) : null,
		max: graded > 0 ? Math.max(...scores).toFixed(2) : null,
		below10: graded > 0 ? scores.filter((s) => s < 10).length : 0,
	};
}
