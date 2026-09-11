import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./tracks.service";
import {
	createSchema,
	getGridSchema,
	idSchema,
	listSchema,
	upsertCoefficientSchema,
} from "./tracks.zod";

const bulkCreateSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1).max(100),
				code: z.string().min(1).max(20),
				cycleLevel: z.enum(["first_cycle", "second_cycle", "technical"]),
				isOfficial: z.boolean().optional(),
			}),
		)
		.min(1)
		.max(200),
});

const bulkUpsertCoefficientsSchema = z.object({
	items: z
		.array(
			z.object({
				trackId: z.string().uuid(),
				subjectId: z.string().uuid(),
				coefficient: z.number().int().min(0).max(20),
				isOfficialExamSubject: z.boolean().optional(),
			}),
		)
		.min(1)
		.max(5000),
});

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.list(ctx.institution.id, input)),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreate(input.items, ctx.institution.id),
		),
	upsertCoefficient: adminProcedure
		.input(upsertCoefficientSchema)
		.mutation(({ ctx, input }) =>
			service.upsertCoefficient(input, ctx.institution.id),
		),
	bulkUpsertCoefficients: adminProcedure
		.input(bulkUpsertCoefficientsSchema)
		.mutation(({ input }) => service.bulkUpsertCoefficients(input.items)),
	getCoefficientsGrid: tenantProcedure
		.input(getGridSchema)
		.query(({ ctx, input }) =>
			service.getCoefficientsGrid(input.trackId, ctx.institution.id),
		),
});
