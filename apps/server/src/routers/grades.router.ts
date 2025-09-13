import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/grades.service";

const upsertSchema = z.object({ studentId: z.string(), examId: z.string(), score: z.number() });
const updateSchema = z.object({ id: z.string(), score: z.number() });
const idSchema = z.object({ id: z.string() });
const listExamSchema = z.object({ examId: z.string(), cursor: z.string().optional(), limit: z.number().optional() });
const listStudentSchema = z.object({ studentId: z.string(), cursor: z.string().optional(), limit: z.number().optional() });
const listClassCourseSchema = z.object({ classCourseId: z.string(), cursor: z.string().optional(), limit: z.number().optional() });
const avgExamSchema = z.object({ examId: z.string() });
const avgCourseSchema = z.object({ courseId: z.string() });
const avgStudentCourseSchema = z.object({ studentId: z.string(), courseId: z.string() });

export const gradesRouter = router({
  upsertNote: adminProcedure.input(upsertSchema).mutation(({ input }) => service.upsertNote(input.studentId, input.examId, input.score)),
  updateNote: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateNote(input.id, input.score)),
  deleteNote: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteNote(input.id)),
  listByExam: protectedProcedure.input(listExamSchema).query(({ input }) => service.listByExam(input)),
  listByStudent: protectedProcedure.input(listStudentSchema).query(({ input }) => service.listByStudent(input)),
  listByClassCourse: protectedProcedure.input(listClassCourseSchema).query(({ input }) => service.listByClassCourse(input)),
  avgForExam: protectedProcedure.input(avgExamSchema).query(({ input }) => service.avgForExam(input.examId)),
  avgForCourse: protectedProcedure.input(avgCourseSchema).query(({ input }) => service.avgForCourse(input.courseId)),
  avgForStudentInCourse: protectedProcedure.input(avgStudentCourseSchema).query(({ input }) => service.avgForStudentInCourse(input.studentId, input.courseId)),
});
