import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/students.service";

const baseSchema = z.object({ firstName: z.string(), lastName: z.string(), email: z.string().email(), registrationNumber: z.string(), classId: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ classId: z.string().optional(), q: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });

export const studentsRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createStudent({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    registrationNumber: input.registrationNumber,
    class: input.classId,
  })),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateStudent(input.id, input)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listStudents(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getStudentById(input.id)),
});
