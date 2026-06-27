import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./grade-scales.service";
import { upsertGradeScaleSchema } from "./grade-scales.zod";

export const gradeScalesRouter = router({
	get: protectedProcedure.query(({ ctx }) =>
		service.getRawForInstitution(ctx.institution.id),
	),

	upsert: adminProcedure
		.input(upsertGradeScaleSchema)
		.mutation(({ ctx, input }) => service.upsert(ctx.institution.id, input)),
});
