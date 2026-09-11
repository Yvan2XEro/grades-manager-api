import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./official-exams.service";
import {
	bulkRegisterSchema,
	checkEligibilitySchema,
	createSessionSchema,
	idSchema,
	listCandidatesSchema,
	listSessionsSchema,
	printCandidateListSchema,
	printEligibilityListSchema,
	registerCandidateSchema,
	updateRegistrationSchema,
	updateSessionSchema,
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
				{ page: input.page, pageSize: input.pageSize },
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

	updateSession: adminProcedure
		.input(updateSessionSchema)
		.mutation(({ ctx, input }) => {
			const { id, ...fields } = input;
			return service.updateSession(id, ctx.institution.id, fields);
		}),

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

	bulkRegisterCandidates: adminProcedure
		.input(bulkRegisterSchema)
		.mutation(({ ctx, input }) =>
			service.bulkRegisterCandidates(input, ctx.institution.id),
		),

	checkEligibility: adminProcedure
		.input(checkEligibilitySchema)
		.mutation(({ ctx, input }) =>
			service.checkEligibility(
				input.registrationId,
				ctx.institution.id,
				input.minAverage,
			),
		),
	printEligibilityList: adminProcedure
		.input(printEligibilityListSchema)
		.mutation(({ ctx, input }) =>
			service.printEligibilityList(input.examSessionId, ctx.institution.id),
		),
	printCandidateList: adminProcedure
		.input(printCandidateListSchema)
		.mutation(({ ctx, input }) =>
			service.printCandidateList(input.examSessionId, ctx.institution.id),
		),
});
