import { z } from "zod";
import { adminProcedure, router, tenantProcedure } from "@/lib/trpc";
import * as service from "./admissions.service";
import {
	listApplicationsSchema,
	reviewApplicationSchema,
	submitApplicationSchema,
} from "./admissions.zod";

export const admissionsRouter = router({
	/** Public: submit a new admission application (no login required). */
	submit: tenantProcedure
		.input(submitApplicationSchema)
		.mutation(({ ctx, input }) =>
			service.submitApplication(ctx.institution.id, input),
		),

	/** Public: look up application status by reference code. */
	getByReferenceCode: tenantProcedure
		.input(z.object({ referenceCode: z.string().min(1) }))
		.query(({ ctx, input }) =>
			service.getByReferenceCode(ctx.institution.id, input.referenceCode),
		),

	/** Admin: paginated list of applications with optional filters. */
	list: adminProcedure
		.input(listApplicationsSchema)
		.query(({ ctx, input }) =>
			service.listApplications(ctx.institution.id, input),
		),

	/** Admin: full detail of a single application. */
	get: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(({ ctx, input }) =>
			service.getApplication(ctx.institution.id, input.id),
		),

	/** Admin: move a submitted application to "under review". */
	setUnderReview: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.setUnderReview(
				ctx.institution.id,
				input.id,
				ctx.profile.id,
			);
		}),

	/** Admin: accept, reject, or waitlist an application. */
	review: adminProcedure
		.input(reviewApplicationSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.reviewApplication(
				ctx.institution.id,
				ctx.profile.id,
				input,
			);
		}),
});
