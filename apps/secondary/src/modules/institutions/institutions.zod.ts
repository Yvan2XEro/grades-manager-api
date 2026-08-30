import { z } from "zod";

export const updateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	minesecCode: z.string().max(50).optional(),
	type: z.enum(["lycee", "college", "mixed"]).optional(),
	address: z.string().optional(),
	city: z.string().max(100).optional(),
	phone: z.string().max(30).optional(),
	email: z.string().email().optional().or(z.literal("")),
	assessmentMode: z.enum(["six_sequence", "composition"]).optional(),
	logoUrl: z.string().url().optional().or(z.literal("")),
});
