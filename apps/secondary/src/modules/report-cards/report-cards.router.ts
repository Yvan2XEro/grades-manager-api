import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./report-cards.service";
import { generateSchema, idSchema, listSchema } from "./report-cards.zod";

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
});
