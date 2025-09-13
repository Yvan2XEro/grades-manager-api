import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import * as service from "../services/exams.service";

const baseSchema = z.object({ name: z.string(), type: z.string(), date: z.coerce.date(), percentage: z.number(), classCourseId: z.string() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const listSchema = z.object({ classCourseId: z.string().optional(), dateFrom: z.coerce.date().optional(), dateTo: z.coerce.date().optional(), cursor: z.string().optional(), limit: z.number().optional() });
const idSchema = z.object({ id: z.string() });
const lockSchema = z.object({ examId: z.string(), lock: z.boolean() });

export const examsRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createExam({
    name: input.name,
    type: input.type,
    date: input.date,
    percentage: input.percentage.toString(),
    classCourse: input.classCourseId,
  })),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateExam(input.id, {
    ...input,
    percentage: input.percentage !== undefined ? input.percentage.toString() : undefined,
  })),
  delete: adminProcedure.input(idSchema).mutation(({ input }) => service.deleteExam(input.id)),
  lock: adminProcedure.input(lockSchema).mutation(({ input }) => service.setLock(input.examId, input.lock)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listExams(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getExamById(input.id)),
});
