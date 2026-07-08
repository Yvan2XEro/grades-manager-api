import { z } from "zod";
import { adminProcedure, router, tenantProcedure } from "@/lib/trpc";
import * as service from "./admissions.service";
import {
	convertApplicationSchema,
	listApplicationsSchema,
	listRequirementsSchema,
	reviewApplicationSchema,
	reviewDocumentSchema,
	submitApplicationSchema,
	submitDocumentSchema,
	upsertRequirementSchema,
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

	/** Public: applicant-safe status lookup with the latest checklist. */
	getStatus: tenantProcedure
		.input(z.object({ referenceCode: z.string().min(1) }))
		.query(({ ctx, input }) =>
			service.getStatus(ctx.institution.id, input.referenceCode),
		),

	/** Public: tenant-scoped options needed by the applicant form. */
	publicOptions: tenantProcedure.query(({ ctx }) =>
		service.getPublicOptions(ctx.institution.id),
	),

	/** Public: list admission document requirements for a program. */
	listRequirements: tenantProcedure
		.input(listRequirementsSchema)
		.query(({ ctx, input }) =>
			service.listDocumentRequirements(ctx.institution.id, input),
		),

	/** Public: submit/update a document reference for an application. */
	submitDocument: tenantProcedure
		.input(submitDocumentSchema)
		.mutation(({ ctx, input }) =>
			service.submitApplicationDocument(ctx.institution.id, input),
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

	/** Admin: configure admission supporting-document requirements. */
	upsertRequirement: adminProcedure
		.input(upsertRequirementSchema)
		.mutation(({ ctx, input }) =>
			service.upsertDocumentRequirement(ctx.institution.id, input),
		),

	/** Admin: checklist view with missing/invalid documents. */
	getChecklist: adminProcedure
		.input(z.object({ applicationId: z.string().uuid() }))
		.query(({ ctx, input }) =>
			service.getApplicationChecklist(ctx.institution.id, input.applicationId),
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

	/** Admin: validate or invalidate an uploaded application document. */
	reviewDocument: adminProcedure
		.input(reviewDocumentSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.reviewApplicationDocument(
				ctx.institution.id,
				ctx.profile.id,
				input,
			);
		}),

	/** Admin: convert an accepted application into a student + enrollment once. */
	convert: adminProcedure
		.input(convertApplicationSchema)
		.mutation(({ ctx, input }) =>
			service.convertAcceptedApplication(ctx.institution.id, input),
		),
});
