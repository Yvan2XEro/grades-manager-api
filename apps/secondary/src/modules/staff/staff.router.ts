import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./staff.service";
import { createSchema, idSchema, listSchema, updateSchema } from "./staff.zod";

const bulkCreateSchema = z.object({
	items: z
		.array(
			z.object({
				firstName: z.string().min(1).max(100),
				lastName: z.string().min(1).max(100),
				email: z.string().email().max(255),
				phone: z.string().max(30).optional(),
				role: z
					.enum(["teacher", "admin", "principal", "vice_principal", "staff"])
					.optional(),
			}),
		)
		.min(1)
		.max(500),
});

export const router = trpcRouter({
	list: tenantProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.list(ctx.institution.id, input)),
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
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) => {
		const { id, ...fields } = input;
		return service.updateStaff(id, ctx.institution.id, fields);
	}),
	count: tenantProcedure.query(({ ctx }) => service.count(ctx.institution.id)),
});
