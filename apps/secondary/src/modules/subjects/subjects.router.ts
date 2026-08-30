import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./subjects.service";
import { createSchema, listSchema, updateSchema } from "./subjects.zod";

const bulkCreateSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1).max(100),
				nameFr: z.string().max(100).optional(),
				code: z.string().min(1).max(30),
				minesecCode: z.string().max(30).optional(),
				subjectGroup: z.string().max(50).optional(),
			}),
		)
		.min(1)
		.max(500),
});

export const router = trpcRouter({
	groups: tenantProcedure.query(({ ctx }) =>
		service.groups(ctx.institution.id),
	),
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.list(ctx.institution.id, input)),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) => {
		const { id, ...fields } = input;
		return service.updateSubject(id, ctx.institution.id, fields);
	}),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreate(input.items, ctx.institution.id),
		),
});
