import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import * as service from "./institutions.service";
import { upsertInstitutionSchema } from "./institutions.zod";

export const institutionsRouter = router({
	get: protectedProcedure.query(() => service.getInstitution()),
	list: protectedProcedure.query(() => service.listInstitutions()),
	upsert: adminProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ input }) => service.upsertInstitution(input)),
});
