import { adminProcedure, router } from "@/lib/trpc";
import * as service from "./exam-scheduler.service";
import {
	historySchema,
	previewSchema,
	runDetailsSchema,
	scheduleSchema,
} from "./exam-scheduler.zod";

export const examSchedulerRouter = router({
	preview: adminProcedure.input(previewSchema).query(({ input }) =>
		service.previewEligibleClasses(input),
	),
	schedule: adminProcedure.input(scheduleSchema).mutation(({ ctx, input }) =>
		service.scheduleExams(input, ctx.profile?.id ?? null),
	),
	history: adminProcedure.input(historySchema).query(({ input }) =>
		service.listHistory(input),
	),
	details: adminProcedure.input(runDetailsSchema).query(({ input }) =>
		service.getRunDetails(input),
	),
});
