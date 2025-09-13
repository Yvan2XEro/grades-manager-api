import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/classes.service";

const baseSchema = z.object({ name: z.string(), program: z.string(), academicYear: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ programId: z.string().optional(), academicYearId: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });
const transferSchema = z.object({ studentId: z.string(), toClassId: z.string() });

export const classesRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createClass(input)),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateClass(input.id, input)),
  delete: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteClass(input.id)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listClasses(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getClassById(input.id)),
  transferStudent: adminProcedure.input(transferSchema).mutation(({ input }) => service.transferStudent(input.studentId, input.toClassId)),
});
