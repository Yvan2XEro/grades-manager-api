import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./students.service";
import {
	createSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./students.zod";

const bulkCreateSchema = z.object({
	items: z
		.array(
			z.object({
				firstName: z.string().min(1).max(100),
				lastName: z.string().min(1).max(100),
				gender: z.enum(["M", "F"]).optional(),
				mnu: z.string().max(50).optional(),
				dateOfBirth: z.coerce.date().optional(),
				placeOfBirth: z.string().max(100).optional(),
				contactName: z.string().max(200).optional(),
				contactPhone: z.string().max(30).optional(),
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
		.mutation(({ ctx, input }) =>
			service.create(input as any, ctx.institution.id),
		),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) => {
		const { id, ...fields } = input;
		return service.updateStudent(id, ctx.institution.id, fields as any);
	}),
	count: tenantProcedure.query(({ ctx }) => service.count(ctx.institution.id)),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreate(input.items, ctx.institution.id),
		),
});
