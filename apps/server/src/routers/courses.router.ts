import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/courses.service";

const baseSchema = z.object({ name: z.string(), credits: z.number(), hours: z.number(), program: z.string(), defaultTeacher: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ programId: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });
const assignSchema = z.object({ courseId: z.string(), teacherId: z.string() });

export const coursesRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createCourse(input)),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateCourse(input.id, input)),
  delete: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteCourse(input.id)),
  assignDefaultTeacher: adminProcedure.input(assignSchema).mutation(({ input }) => service.assignDefaultTeacher(input.courseId, input.teacherId)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listCourses(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getCourseById(input.id)),
});
