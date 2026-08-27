import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./staff.service";
import { createSchema, idSchema, updateSchema } from "./staff.zod";

export const router = trpcRouter({
	list: tenantProcedure.query(({ ctx }) => service.list(ctx.institution.id)),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	get: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) => service.get(input.id, ctx.institution.id)),
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) => {
		const { id, ...fields } = input;
		return service.updateStaff(id, ctx.institution.id, fields);
	}),
	count: tenantProcedure.query(({ ctx }) => service.count(ctx.institution.id)),
});
