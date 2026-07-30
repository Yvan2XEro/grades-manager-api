import { z } from "zod";
import { adminProcedure, router } from "@/lib/trpc";
import { statsService } from "./stats.service";

const yearInput = z.object({ academicYearId: z.string().optional() });

export const statsRouter = router({
	overview: adminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.overview(ctx.institution.id, input.academicYearId),
		),
	enrollmentStats: adminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.enrollmentStats(ctx.institution.id, input.academicYearId),
		),
	performanceStats: adminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.performanceStats(ctx.institution.id, input.academicYearId),
		),
	financeStats: adminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.financeStats(ctx.institution.id, input.academicYearId),
		),
	admissionsStats: adminProcedure
		.input(yearInput)
		.query(({ ctx, input }) =>
			statsService.admissionsStats(ctx.institution.id, input.academicYearId),
		),
});
