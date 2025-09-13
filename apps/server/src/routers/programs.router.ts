import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/programs.service";

const baseSchema = z.object({ name: z.string(), description: z.string().optional(), faculty: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ facultyId: z.string().optional(), q: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });

export const programsRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createProgram(input)),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateProgram(input.id, input)),
  delete: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteProgram(input.id)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listPrograms(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getProgramById(input.id)),
});
