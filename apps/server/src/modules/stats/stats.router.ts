import { z } from "zod";
import { router, tenantAdminProcedure } from "@/lib/trpc";
import { statsService } from "./stats.service";

const yearInput = z.object({ academicYearId: z.string().optional() });

export const statsRouter = router({
	overview: tenantAdminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.overview(ctx.institution.id, input.academicYearId),
		),
	enrollmentStats: tenantAdminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.enrollmentStats(ctx.institution.id, input.academicYearId),
		),
	performanceStats: tenantAdminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.performanceStats(ctx.institution.id, input.academicYearId),
		),
	financeStats: tenantAdminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.financeStats(ctx.institution.id, input.academicYearId),
		),
	admissionsStats: tenantAdminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.admissionsStats(ctx.institution.id, input.academicYearId),
		),
});
