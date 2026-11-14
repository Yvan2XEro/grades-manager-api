import type { ApiKeySeries, ApiKeyStats } from "../types";

export const ACTIVITY_DAYS = 30;

/**
 * Turns daily per-key counts into one chart row per day over the last `days`
 * days (missing days stay empty). Rows without key are grouped as "unknown".
 */
export function buildActivitySeries(
	stats: ApiKeyStats | undefined,
	days = ACTIVITY_DAYS,
): ApiKeySeries {
	const labelMap = new Map(
		(stats?.keyLabels ?? []).map((k) => [k.id, k.label]),
	);
	const keyIds = [...labelMap.keys()];
	if (stats?.rows.some((r) => r.apiKeyId === null)) {
		keyIds.push("unknown");
	}

	const byDate = new Map<string, Record<string, number>>();
	for (const row of stats?.rows ?? []) {
		const key = row.apiKeyId ?? "unknown";
		if (!byDate.has(row.date)) byDate.set(row.date, {});
		const entry = byDate.get(row.date)!;
		entry[key] = (entry[key] ?? 0) + row.count;
	}

	const chartData: Record<string, number | string>[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const iso = d.toISOString().slice(0, 10);
		const display = d.toLocaleDateString("fr-FR", {
			month: "2-digit",
			day: "2-digit",
		});
		chartData.push({ date: display, ...(byDate.get(iso) ?? {}) });
	}

	return { labelMap, keyIds, chartData };
}
