import { router, tenantAdminProcedure } from "@/lib/trpc";
import * as service from "./exam-scheduler.service";
import {
	historySchema,
	previewSchema,
	runDetailsSchema,
	scheduleSchema,
} from "./exam-scheduler.zod";

export const examSchedulerRouter = router({
	preview: tenantAdminProcedure
		.input(previewSchema)
		.query(({ ctx, input }) =>
			service.previewEligibleClasses(input, ctx.institution.id),
		),
	schedule: tenantAdminProcedure
		.input(scheduleSchema)
		.mutation(({ ctx, input }) =>
			service.scheduleExams(input, ctx.profile?.id ?? null, ctx.institution.id),
		),
	history: tenantAdminProcedure
		.input(historySchema)
		.query(({ ctx, input }) => service.listHistory(input, ctx.institution.id)),
	details: tenantAdminProcedure
		.input(runDetailsSchema)
		.query(({ ctx, input }) =>
			service.getRunDetails(input, ctx.institution.id),
		),
});
