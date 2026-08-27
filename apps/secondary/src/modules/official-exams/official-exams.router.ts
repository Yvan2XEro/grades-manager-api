import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./official-exams.service";
import {
	createSessionSchema,
	idSchema,
	listCandidatesSchema,
	listSessionsSchema,
	registerCandidateSchema,
	updateRegistrationSchema,
} from "./official-exams.zod";

export const router = trpcRouter({
	// ─── Sessions ────────────────────────────────────────────────────────

	listSessions: tenantProcedure
		.input(listSessionsSchema)
		.query(({ ctx, input }) =>
			service.listSessions(
				ctx.institution.id,
				input.academicYearId,
				input.examType,
			),
		),

	getSession: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getSession(input.id, ctx.institution.id),
		),

	createSession: adminProcedure
		.input(createSessionSchema)
		.mutation(({ ctx, input }) =>
			service.createSession(input, ctx.institution.id),
		),

	// ─── Candidate Registrations ─────────────────────────────────────────

	listCandidates: tenantProcedure
		.input(listCandidatesSchema)
		.query(({ ctx, input }) =>
			service.listRegistrations(
				input.examSessionId,
				ctx.institution.id,
				input.isEligible,
				input.isAdmitted,
			),
		),

	getCandidate: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getRegistration(input.id, ctx.institution.id),
		),

	registerCandidate: adminProcedure
		.input(registerCandidateSchema)
		.mutation(({ ctx, input }) =>
			service.registerCandidate(input, ctx.institution.id),
		),

	updateCandidate: adminProcedure
		.input(updateRegistrationSchema)
		.mutation(({ ctx, input }) => {
			const { id, ...fields } = input;
			return service.updateRegistration(id, ctx.institution.id, fields);
		}),
});
