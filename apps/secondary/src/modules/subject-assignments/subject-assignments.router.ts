import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./subject-assignments.service";
import { createSchema, idSchema, listSchema } from "./subject-assignments.zod";

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) =>
			service.list(
				ctx.institution.id,
				input.academicYearId,
				input.classId,
				input.staffId,
			),
		),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.remove(input.id, ctx.institution.id)),
});
