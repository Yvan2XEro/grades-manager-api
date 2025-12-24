import { z } from "zod";

export const assignSchema = z.object({
	examId: z.string().min(1),
	editorProfileId: z.string().min(1),
});

export const listSchema = z.object({
	examId: z.string().min(1),
});

export const revokeSchema = z.object({
	id: z.string().min(1),
	examId: z.string().min(1),
});
