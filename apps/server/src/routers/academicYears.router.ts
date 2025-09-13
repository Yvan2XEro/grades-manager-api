import { z } from "zod";
import { router, protectedProcedure, adminProcedure, superAdminProcedure } from "../lib/trpc";
import * as service from "../services/academicYears.service";

const baseSchema = z.object({ name: z.string(), startDate: z.coerce.date(), endDate: z.coerce.date() });
const updateSchema = baseSchema.partial().extend({ id: z.string() });
const idSchema = z.object({ id: z.string() });
const listSchema = z.object({ cursor: z.string().optional(), limit: z.number().optional() });
const setActiveSchema = z.object({ id: z.string(), isActive: z.boolean() });

export const academicYearsRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) =>
    service.createAcademicYear({
      ...input,
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
    })
  ),
  update: adminProcedure.input(updateSchema).mutation(({ input }) =>
    service.updateAcademicYear(input.id, {
      ...input,
      startDate: input.startDate?.toISOString(),
      endDate: input.endDate?.toISOString(),
    })
  ),
  setActive: superAdminProcedure.input(setActiveSchema).mutation(({ input }) => service.setActive(input.id, input.isActive)),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listAcademicYears(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getAcademicYearById(input.id)),
});
