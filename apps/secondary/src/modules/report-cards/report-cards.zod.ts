import { z } from "zod";

export const REPORT_CARD_STATUSES = [
	"draft",
	"generated",
	"validated_admin",
	"validated_vp",
	"signed",
	"published",
] as const;

export const generateSchema = z.object({
	studentId: z.string().uuid(),
	termId: z.string().uuid(),
});

export const updateStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(REPORT_CARD_STATUSES),
});

export const listSchema = z.object({
	academicYearId: z.string().uuid(),
	termId: z.string().uuid().optional(),
	classId: z.string().uuid().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(500).default(25),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const generatePdfSchema = z.object({ id: z.string().uuid() });

export const batchGenerateSchema = z.object({
	classId: z.string().uuid(),
	termId: z.string().uuid(),
	academicYearId: z.string().uuid(),
});

export const batchPdfSchema = z.object({
	classId: z.string().uuid(),
	termId: z.string().uuid(),
	academicYearId: z.string().uuid(),
});
