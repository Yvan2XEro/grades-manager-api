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

export type AcademicPolicy = ResolvedScale & {
	isPassing(score: number): boolean;
	computeMentionKey(score: number | null): string | null;
	getMentionMeta(
		key: string,
	): { label: string; labelEn: string; gradeLetter: string } | null;
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
	programId?: string | null,
): Promise<ResolvedScale> {
	if (programId) {
		const programRow = await repo.findByProgram(institutionId, programId);
		if (programRow) return resolveScale(programRow);
	}
	const row = await repo.findByInstitution(institutionId);
	return resolveScale(row);
}

export async function resolveAcademicPolicy(
	institutionId: string,
	programId?: string | null,
): Promise<AcademicPolicy> {
	const scale = await getForInstitution(institutionId, programId);
	return {
		...scale,
		isPassing: (score: number) => score >= scale.passThreshold,
		computeMentionKey: (score: number | null) =>
			computeMention(score, scale.mentionRanges),
		getMentionMeta: (key: string) => {
			const range = scale.mentionRanges.find((r) => r.key === key);
			if (!range) return null;
			return {
				label: range.label,
				labelEn: range.labelEn,
				gradeLetter: range.gradeLetter,
			};
		},
	};
}

export async function getRawForInstitution(
	institutionId: string,
	programId?: string | null,
) {
	if (programId) return repo.findByProgram(institutionId, programId);
	return repo.findByInstitution(institutionId);
}

export async function upsert(
	institutionId: string,
	data: {
		passThreshold: number;
		compensationThreshold: number;
		mentionRanges: MentionRange[];
		programId?: string | null;
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
