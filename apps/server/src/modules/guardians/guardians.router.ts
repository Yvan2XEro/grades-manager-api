import { router, tenantAdminProcedure, tenantProcedure } from "@/lib/trpc";
import * as service from "./guardians.service";
import {
	createGuardianSchema,
	linkStudentSchema,
	portalSchema,
	recordCommunicationEventSchema,
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
});
