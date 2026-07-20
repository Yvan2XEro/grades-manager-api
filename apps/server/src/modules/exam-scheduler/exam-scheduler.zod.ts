import { z } from "zod";

export const previewSchema = z.object({
	institutionId: z.string().optional(), // Auto-filled from context
	academicYearId: z.string().min(1),
	semesterId: z.string().min(1).optional(),
});

export const scheduleSchema = previewSchema
	.extend({
		examTypeId: z.string().min(1),
		percentage: z.coerce.number().min(1).max(100),
		dateStart: z.coerce.date(),
		dateEnd: z.coerce.date(),
		semesterId: z.string().min(1).optional(),
		classIds: z.array(z.string()).optional(),
	})
	.refine((value) => value.dateEnd.getTime() >= value.dateStart.getTime(), {
		path: ["dateEnd"],
		message: "End date must be after start date",
	});

export const historySchema = z.object({
	institutionId: z.string().optional(),
	academicYearId: z.string().optional(),
	examTypeId: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});

export const runDetailsSchema = z.object({
	runId: z.string().min(1),
});

export const previewRetakesSchema = z.object({
	academicYearId: z.string().min(1),
	semesterId: z.string().min(1),
	examTypeId: z.string().optional(),
	classId: z.string().optional(),
});

export const scheduleRetakesSchema = previewRetakesSchema
	.extend({
		dateStart: z.coerce.date(),
		dateEnd: z.coerce.date(),
		examIds: z.array(z.string()).min(1),
		scoringPolicy: z.enum(["replace", "best_of"]).default("replace"),
	})
	.refine((value) => value.dateEnd.getTime() >= value.dateStart.getTime(), {
		path: ["dateEnd"],
		message: "End date must be after start date",
	});

export type PreviewInput = z.infer<typeof previewSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type HistoryInput = z.infer<typeof historySchema>;
export type RunDetailsInput = z.infer<typeof runDetailsSchema>;
export type PreviewRetakesInput = z.infer<typeof previewRetakesSchema>;
export type ScheduleRetakesInput = z.infer<typeof scheduleRetakesSchema>;
