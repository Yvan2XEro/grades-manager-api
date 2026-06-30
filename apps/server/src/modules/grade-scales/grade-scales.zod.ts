import { z } from "zod";

export const mentionRangeSchema = z.object({
	key: z.string().min(1),
	label: z.string().min(1),
	labelEn: z.string().min(1),
	gradeLetter: z.string().min(1).max(2),
	min: z.number().min(0).max(20),
});

export const upsertGradeScaleSchema = z.object({
	programId: z.string().uuid().nullish(),
	passThreshold: z.number().min(0).max(20),
	compensationThreshold: z.number().min(0).max(20),
	mentionRanges: z
		.array(mentionRangeSchema)
		.min(1)
		.refine(
			(ranges) => {
				const mins = ranges.map((r) => r.min);
				return new Set(mins).size === mins.length;
			},
			{ message: "Each mention range must have a unique minimum threshold" },
		),
});
