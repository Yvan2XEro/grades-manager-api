import { z } from "zod";
import { router, protectedProcedure, adminProcedure, superAdminProcedure } from "../lib/trpc";
import * as service from "../services/faculties.service";

const createSchema = z.object({ name: z.string(), description: z.string().optional() });
const updateSchema = z.object({ id: z.string(), name: z.string().optional(), description: z.string().optional() });
const idSchema = z.object({ id: z.string() });
const listSchema = z.object({ q: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });

export const facultiesRouter = router({
  create: adminProcedure.input(createSchema).mutation(({ input }) => service.createFaculty(input)),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateFaculty(input.id, input)),
  delete: superAdminProcedure.input(idSchema).mutation(({ input }) => service.deleteFaculty(input.id)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listFaculties(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getFacultyById(input.id)),
});
