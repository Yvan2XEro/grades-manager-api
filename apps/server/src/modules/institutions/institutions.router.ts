import { adminProcedure, protectedProcedure, router } from "@/lib/trpc";
import { upsertInstitutionSchema } from "./institutions.zod";
import * as service from "./institutions.service";

export const institutionsRouter = router({
	get: protectedProcedure.query(() => service.getInstitution()),
	upsert: adminProcedure
		.input(upsertInstitutionSchema)
		.mutation(({ input }) => service.upsertInstitution(input)),
});
