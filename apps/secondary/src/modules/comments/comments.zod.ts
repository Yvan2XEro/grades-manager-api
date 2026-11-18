import { z } from "zod";

export const upsertCommentSchema = z.object({
	studentId: z.string().uuid(),
	subjectId: z.string().uuid(),
	termId: z.string().uuid(),
	classId: z.string().uuid(),
	comment: z
		.string()
		.max(200)
		.transform((v) => v.trim()),
});

export const batchUpsertCommentsSchema = z.object({
	items: z.array(upsertCommentSchema).max(200),
});

export const listCommentsSchema = z.object({
	classId: z.string().uuid(),
	subjectId: z.string().uuid(),
	termId: z.string().uuid(),
});
