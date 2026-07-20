import { router, tenantAdminProcedure, tenantProcedure } from "@/lib/trpc";
import * as service from "./guardians.service";
import {
	createGuardianSchema,
	deleteGuardianSchema,
	linkStudentSchema,
	listAllSchema,
	portalSchema,
	recordCommunicationEventSchema,
	removeLinkSchema,
	studentIdSchema,
	updatePreferencesSchema,
} from "./guardians.zod";

export const guardiansRouter = router({
	create: tenantAdminProcedure
		.input(createGuardianSchema)
		.mutation(({ ctx, input }) =>
			service.createGuardian(ctx.institution.id, input),
		),

	linkStudent: tenantAdminProcedure
		.input(linkStudentSchema)
		.mutation(({ ctx, input }) =>
			service.linkStudent(ctx.institution.id, input),
		),

	listByStudent: tenantAdminProcedure
		.input(studentIdSchema)
		.query(({ ctx, input }) =>
			service.listByStudent(ctx.institution.id, input.studentId),
		),

	updatePreferences: tenantAdminProcedure
		.input(updatePreferencesSchema)
		.mutation(({ ctx, input }) =>
			service.updatePreferences(ctx.institution.id, input),
		),

	recordCommunicationEvent: tenantAdminProcedure
		.input(recordCommunicationEventSchema)
		.mutation(({ ctx, input }) =>
			service.recordCommunicationEvent(ctx.institution.id, input),
		),

	portal: tenantProcedure
		.input(portalSchema)
		.query(({ input }) => service.portal(input.accessToken)),

	listAll: tenantAdminProcedure
		.input(listAllSchema)
		.query(({ input, ctx }) => service.listAll(ctx.institution.id, input)),

	removeLink: tenantAdminProcedure
		.input(removeLinkSchema)
		.mutation(({ input, ctx }) =>
			service.removeLink(ctx.institution.id, input),
		),

	delete: tenantAdminProcedure
		.input(deleteGuardianSchema)
		.mutation(({ input, ctx }) =>
			service.deleteGuardian(ctx.institution.id, input.id),
		),
});
