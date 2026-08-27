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
});
