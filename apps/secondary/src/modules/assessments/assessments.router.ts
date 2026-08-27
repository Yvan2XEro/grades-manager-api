import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./assessments.service";
import {
	batchUpsertSchema,
	listSchema,
	studentResultsSchema,
	upsertSchema,
} from "./assessments.zod";

export const router = trpcRouter({
	listForClass: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.listForClass(
				ctx.institution.id,
				input.classId,
				input.subjectId,
				input.termId,
			),
		),

	upsert: adminProcedure
		.input(upsertSchema)
		.mutation(({ ctx, input }) =>
			service.upsert(input, ctx.institution.id, ctx.session?.user.id),
		),

	batchUpsert: adminProcedure
		.input(batchUpsertSchema)
		.mutation(({ ctx, input }) =>
			service.batchUpsert(
				input.items,
				ctx.institution.id,
				ctx.session?.user.id,
			),
		),

	getStudentResults: tenantProcedure
		.input(studentResultsSchema)
		.query(({ ctx, input }) =>
			service.getStudentResults(
				ctx.institution.id,
				input.studentId,
				input.termId,
			),
		),
});
