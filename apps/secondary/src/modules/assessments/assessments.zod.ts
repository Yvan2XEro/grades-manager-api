import { z } from "zod";

const ASSESSMENT_TYPES = [
	"sequence_1",
	"sequence_2",
	"sequence_3",
	"sequence_4",
	"sequence_5",
	"sequence_6",
	"end_of_term_exam",
	"class_test",
	"quiz",
] as const;

export const upsertSchema = z.object({
	studentId: z.string().uuid(),
	subjectId: z.string().uuid(),
	termId: z.string().uuid(),
	classId: z.string().uuid(),
	assessmentType: z.enum(ASSESSMENT_TYPES as unknown as [string, ...string[]]),
	value: z.number().min(0).max(20).nullable(),
});

export const batchUpsertSchema = z.object({
	items: z.array(upsertSchema).min(1).max(100),
});

export const listSchema = z.object({
	classId: z.string().uuid(),
	subjectId: z.string().uuid(),
	termId: z.string().uuid(),
});

export const studentResultsSchema = z.object({
	studentId: z.string().uuid(),
	termId: z.string().uuid(),
});
