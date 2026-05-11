import { z } from "zod";
import { router, tenantGradingProcedure } from "@/lib/trpc";
import * as service from "./export-eligibility.service";

const ecSchema = z.object({ classCourseId: z.string() });
const ueSchema = z.object({
	teachingUnitId: z.string(),
	classId: z.string(),
	semesterId: z.string().optional(),
});
const pvSchema = z.object({
	classId: z.string(),
	semesterId: z.string().optional(),
});

export const exportEligibilityRouter = router({
	checkEC: tenantGradingProcedure
		.input(ecSchema)
		.query(({ ctx, input }) =>
			service.checkEcEligibility(input.classCourseId, ctx.institution.id),
		),
	checkUE: tenantGradingProcedure.input(ueSchema).query(({ ctx, input }) =>
		service.checkUeEligibility({
			...input,
			institutionId: ctx.institution.id,
		}),
	),
	checkPV: tenantGradingProcedure.input(pvSchema).query(({ ctx, input }) =>
		service.checkPvEligibility({
			...input,
			institutionId: ctx.institution.id,
		}),
	),
});
