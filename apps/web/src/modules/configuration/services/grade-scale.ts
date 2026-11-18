import type { MentionRange } from "../types";

export const DEFAULT_RANGES: MentionRange[] = [
	{
		key: "excellent",
		label: "Excellent",
		labelEn: "Excellent",
		gradeLetter: "A",
		min: 18,
	},
	{
		key: "tres_bien",
		label: "Très Bien",
		labelEn: "Very Good",
		gradeLetter: "B",
		min: 16,
	},
	{ key: "bien", label: "Bien", labelEn: "Good", gradeLetter: "C", min: 14 },
	{
		key: "assez_bien",
		label: "Assez Bien",
		labelEn: "Fair",
		gradeLetter: "D",
		min: 12,
	},
	{
		key: "passable",
		label: "Passable",
		labelEn: "Satisfactory",
		gradeLetter: "E",
		min: 10,
	},
];

/** True when two ranges start at the same score. */
export const hasDuplicateMin = (ranges: MentionRange[]) => {
	const mins = ranges.map((r) => r.min);
	return new Set(mins).size !== mins.length;
};

/** The mention a score earns: the range with the highest `min` it reaches. */
export const findMention = (ranges: MentionRange[], score: number) =>
	[...ranges].sort((a, b) => b.min - a.min).find((r) => score >= r.min) ?? null;
