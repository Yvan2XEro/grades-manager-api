import { z } from "zod";

export const createSchema = z.object({
	name: z.string().min(1).max(50),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	assessmentMode: z
		.enum(["six_sequence", "composition"])
		.optional()
		.default("six_sequence"),
});

export const idSchema = z.object({
	id: z.string().uuid(),
});
