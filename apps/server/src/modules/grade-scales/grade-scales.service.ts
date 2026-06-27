import {
	DEFAULT_MENTION_RANGES,
	type GradeScale,
	type MentionRange,
} from "@/db/schema/app-schema";
import * as repo from "./grade-scales.repo";

export type ResolvedScale = {
	passThreshold: number;
	compensationThreshold: number;
	mentionRanges: MentionRange[];
};

const DEFAULT_SCALE: ResolvedScale = {
	passThreshold: 10,
	compensationThreshold: 8,
	mentionRanges: DEFAULT_MENTION_RANGES,
};

function resolveScale(row: GradeScale | undefined): ResolvedScale {
	if (!row) return DEFAULT_SCALE;
	return {
		passThreshold: Number(row.passThreshold),
		compensationThreshold: Number(row.compensationThreshold),
		mentionRanges:
			Array.isArray(row.mentionRanges) && row.mentionRanges.length > 0
				? row.mentionRanges
				: DEFAULT_MENTION_RANGES,
	};
}

export async function getForInstitution(
	institutionId: string,
): Promise<ResolvedScale> {
	const row = await repo.findByInstitution(institutionId);
	return resolveScale(row);
}

export async function getRawForInstitution(institutionId: string) {
	return repo.findByInstitution(institutionId);
}

export async function upsert(
	institutionId: string,
	data: {
		passThreshold: number;
		compensationThreshold: number;
		mentionRanges: MentionRange[];
	},
) {
	return repo.upsert(institutionId, data);
}

export function computeMention(
	average: number | null,
	mentionRanges: MentionRange[],
): string | null {
	if (average === null) return null;
	const sorted = [...mentionRanges].sort((a, b) => b.min - a.min);
	return sorted.find((r) => average >= r.min)?.key ?? null;
}

export function buildMentionLabelMap(
	mentionRanges: MentionRange[],
): Record<string, string> {
	return Object.fromEntries(mentionRanges.map((r) => [r.key, r.label]));
}
