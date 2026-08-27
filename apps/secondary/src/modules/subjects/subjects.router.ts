import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./subjects.service";
import { createSchema, updateSchema } from "./subjects.zod";

export const router = trpcRouter({
	list: tenantProcedure.query(({ ctx }) => service.list(ctx.institution.id)),
	create: adminProcedure
		.input(createSchema)
		.mutation(({ ctx, input }) => service.create(input, ctx.institution.id)),
	update: adminProcedure.input(updateSchema).mutation(({ ctx, input }) => {
		const { id, ...fields } = input;
		return service.updateSubject(id, ctx.institution.id, fields);
	}),
});
