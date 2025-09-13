import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/classCourses.service";

const baseSchema = z.object({ class: z.string(), course: z.string(), teacher: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ classId: z.string().optional(), courseId: z.string().optional(), teacherId: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });

export const classCoursesRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createClassCourse(input)),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateClassCourse(input.id, input)),
  delete: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteClassCourse(input.id)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listClassCourses(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getClassCourseById(input.id)),
});
