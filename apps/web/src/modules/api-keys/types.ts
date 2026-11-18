import type { ApiKey } from "@/utils/type";

export type { ApiKey };

/** Daily counts per API key, as returned by the activity/call stats queries. */
export interface ApiKeyStats {
	keyLabels: { id: string; label: string }[];
	rows: { date: string; apiKeyId: string | null; count: number }[];
}

/** Chart-ready series: one entry per day, one numeric field per key id. */
export interface ApiKeySeries {
	labelMap: Map<string, string>;
	keyIds: string[];
	chartData: Record<string, number | string>[];
}
