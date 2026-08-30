import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./classes.service";
import {
	createSchema,
	idSchema,
	listSchema,
	rosterSchema,
} from "./classes.zod";

const bulkCreateSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1).max(50),
				code: z.string().min(1).max(20),
				level: z.string().min(1).max(30),
				academicYearId: z.string().uuid(),
				trackId: z.string().uuid().optional(),
				room: z.string().max(50).optional(),
				maxCapacity: z.number().int().positive().optional(),
			}),
		)
		.min(1)
		.max(200),
});

export const router = trpcRouter({
	list: tenantProcedure.input(listSchema).query(({ ctx, input }) =>
		service.list(input.academicYearId, ctx.institution.id, {
			search: input.search,
			level: input.level,
			page: input.page,
			pageSize: input.pageSize,
		}),
	),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreate(input.items, ctx.institution.id),
		),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	getRoster: tenantProcedure
		.input(rosterSchema)
		.query(({ ctx, input }) =>
			service.getRoster(input.classId, ctx.institution.id),
		),
});
