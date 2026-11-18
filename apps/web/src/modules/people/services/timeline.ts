import type { TimelineEvent } from "../types";

/** Groups events by calendar year, most recent year first. */
export function groupByYear(events: TimelineEvent[]) {
	const groups = new Map<string, TimelineEvent[]>();
	for (const e of events) {
		const yr = new Date(e.date).getFullYear().toString();
		const list = groups.get(yr) ?? [];
		list.push(e);
		groups.set(yr, list);
	}
	return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}
