import { z } from "zod";
import type { InstitutionType } from "../../lib/academic-levels";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./classes.service";
import {
	classLevelSchema,
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
				level: classLevelSchema,
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
		.mutation(({ ctx, input }) =>
			service.create(
				input,
				ctx.institution.id,
				ctx.institution.type as InstitutionType,
			),
		),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreate(
				input.items,
				ctx.institution.id,
				ctx.institution.type as InstitutionType,
			),
		),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(50).optional(),
				code: z.string().min(1).max(20).optional(),
				level: classLevelSchema.optional(),
				room: z.string().max(50).optional().nullable(),
				maxCapacity: z.number().int().positive().optional().nullable(),
				trackId: z.string().uuid().optional().nullable(),
			}),
		)
		.mutation(({ ctx, input }) =>
			service.update(
				input.id,
				input,
				ctx.institution.id,
				ctx.institution.type as InstitutionType,
			),
		),
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(({ ctx, input }) => service.remove(input.id, ctx.institution.id)),
	getRoster: tenantProcedure
		.input(rosterSchema)
		.query(({ ctx, input }) =>
			service.getRoster(input.classId, ctx.institution.id),
		),
});
