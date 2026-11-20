import { z } from "zod";
import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./grade-scales.service";
import { upsertGradeScaleSchema } from "./grade-scales.zod";

export const gradeScalesRouter = router({
	get: tenantProtectedProcedure
		.input(z.object({ programId: z.string().uuid().nullish() }).optional())
		.query(({ ctx, input }) =>
			service.getRawForInstitution(ctx.institution.id, input?.programId),
		),

	upsert: tenantAdminProcedure
		.input(upsertGradeScaleSchema)
		.mutation(({ ctx, input }) => service.upsert(ctx.institution.id, input)),
});
