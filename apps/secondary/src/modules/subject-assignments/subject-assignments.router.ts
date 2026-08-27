import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { staff } from "../../db/schema";
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

	listMine: tenantProcedure
		.input(z.object({ academicYearId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const [staffRow] = await ctx.db
				.select({ id: staff.id })
				.from(staff)
				.where(
					and(
						eq(staff.authUserId, ctx.session.user.id),
						eq(staff.institutionId, ctx.institution.id),
					),
				)
				.limit(1);
			if (!staffRow) return [];
			return service.list(
				ctx.institution.id,
				input.academicYearId,
				undefined,
				staffRow.id,
			);
		}),

	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	delete: adminProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) => service.remove(input.id, ctx.institution.id)),
});
