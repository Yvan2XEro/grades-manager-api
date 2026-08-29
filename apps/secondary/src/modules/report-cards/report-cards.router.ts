import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./report-cards.service";
import {
	generatePdfSchema,
	generateSchema,
	idSchema,
	listSchema,
	updateStatusSchema,
} from "./report-cards.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(
				ctx.institution.id,
				input.academicYearId,
				input.termId,
				input.classId,
				{ page: input.page, pageSize: input.pageSize },
			),
		),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	generate: adminProcedure
		.input(generateSchema)
		.mutation(({ ctx, input }) =>
			service.generate(input.studentId, input.termId, ctx.institution.id),
		),
	generatePdf: adminProcedure
		.input(generatePdfSchema)
		.mutation(({ ctx, input }) =>
			service.generatePdf(input.id, ctx.institution.id),
		),
	updateStatus: adminProcedure
		.input(updateStatusSchema)
		.mutation(({ ctx, input }) =>
			service.updateStatus(input.id, input.status, ctx.institution.id),
		),
});
