import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./grade-scales.service";
import { upsertGradeScaleSchema } from "./grade-scales.zod";

export const gradeScalesRouter = router({
	get: protectedProcedure
		.input(z.object({ programId: z.string().uuid().nullish() }).optional())
		.query(({ ctx, input }) =>
			service.getRawForInstitution(ctx.institution.id, input?.programId),
		),

	upsert: adminProcedure
		.input(upsertGradeScaleSchema)
		.mutation(({ ctx, input }) => service.upsert(ctx.institution.id, input)),
});
