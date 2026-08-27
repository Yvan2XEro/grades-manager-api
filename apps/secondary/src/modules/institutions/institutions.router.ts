import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./institutions.service";
import { updateSchema } from "./institutions.zod";

export const router = trpcRouter({
	get: tenantProcedure.query(({ ctx }) => ctx.institution),

	update: adminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) => service.update(ctx.institution.id, input)),
});
