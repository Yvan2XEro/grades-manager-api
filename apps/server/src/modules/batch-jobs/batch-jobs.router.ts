import { router as createRouter, tenantAdminProcedure } from "@/lib/trpc";
import * as service from "./batch-jobs.service";
import type { BatchJobType } from "./batch-jobs.types";
import {
	cancelSchema,
	getJobSchema,
	listJobsSchema,
	previewSchema,
	rollbackSchema,
	runSchema,
} from "./batch-jobs.zod";

export const router = createRouter({
	preview: tenantAdminProcedure
		.input(previewSchema)
		.mutation(({ ctx, input }) =>
			service.previewJob(
				input.type as BatchJobType,
				input.params as Record<string, unknown>,
				ctx.institution.id,
				ctx.profile?.id ?? null,
			),
		),

	run: tenantAdminProcedure
		.input(runSchema)
		.mutation(({ ctx, input }) =>
			service.runJob(input.jobId, ctx.institution.id),
		),

	cancel: tenantAdminProcedure
		.input(cancelSchema)
		.mutation(({ ctx, input }) =>
			service.cancelJob(input.jobId, ctx.institution.id),
		),

	rollback: tenantAdminProcedure
		.input(rollbackSchema)
		.mutation(({ ctx, input }) =>
			service.rollbackJob(
				input.jobId,
				ctx.institution.id,
				ctx.profile?.id ?? null,
			),
		),

	get: tenantAdminProcedure
		.input(getJobSchema)
		.query(({ ctx, input }) => service.getJob(input.jobId, ctx.institution.id)),

	list: tenantAdminProcedure.input(listJobsSchema).query(({ ctx, input }) =>
		service.listJobs(ctx.institution.id, {
			status: input.status,
			type: input.type,
			limit: input.limit,
			offset: input.offset,
		}),
	),
});
