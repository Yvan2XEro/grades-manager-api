import { z } from "zod";

export const createFeeScheduleSchema = z.object({
	academicYearId: z.string().uuid(),
	classId: z.string().uuid().optional(),
	tuitionAmount: z.number().int().min(0).default(0),
	apeAmount: z.number().int().min(0).default(0),
	instalments: z
		.array(
			z.object({
				dueDate: z.coerce.date(),
				amount: z.number().int().min(0),
				label: z.string().max(100).optional(),
			}),
		)
		.optional(),
});

export const recordPaymentSchema = z.object({
	enrollmentId: z.string().uuid(),
	amount: z.number().int().positive(),
	feeType: z.enum(["tuition", "ape", "other"]).default("tuition"),
	paymentMethod: z
		.enum(["cash", "mtn_momo", "orange_money", "bank_transfer", "campost"])
		.default("cash"),
	reference: z.string().max(100).optional(),
	paidAt: z.coerce.date().optional(),
	note: z.string().max(500).optional(),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const listSchedulesSchema = z.object({
	academicYearId: z.string().uuid().optional(),
	classId: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(200).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});

export const listPaymentsSchema = z.object({
	enrollmentId: z.string().uuid().optional(),
	feeType: z.enum(["tuition", "ape", "other"]).optional(),
	limit: z.number().int().min(1).max(200).optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
});
