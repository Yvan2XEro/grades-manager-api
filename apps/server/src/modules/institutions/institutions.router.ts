import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./institutions.service";
import {
	createInstitutionSchema,
	deleteInstitutionSchema,
	updateInstitutionSchema,
	upsertInstitutionSchema,
} from "./institutions.zod";

export const institutionsRouter = router({
	get: protectedProcedure.query(() => service.getInstitution()),
	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(({ input }) => service.getInstitutionById(input.id)),
	list: protectedProcedure.query(() => service.listInstitutions()),
	upsert: adminProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ input }) => service.upsertInstitution(input)),
	create: adminProcedure
		.input(createInstitutionSchema)
		.mutation(({ input }) => service.createInstitution(input)),
	update: adminProcedure
		.input(updateInstitutionSchema)
		.mutation(({ input }) => service.updateInstitution(input.id, input.data)),
	delete: adminProcedure
		.input(deleteInstitutionSchema)
		.mutation(({ input }) => service.deleteInstitution(input.id)),
});
