import { z } from "zod";

export const profileIdSchema = z.object({ profileId: z.string() });

export const profileResultsSchema = z.object({
	profileId: z.string(),
	academicYearId: z.string().optional(),
});
