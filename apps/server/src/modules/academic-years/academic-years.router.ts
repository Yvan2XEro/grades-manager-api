import { router as createRouter, protectedProcedure, adminProcedure, superAdminProcedure } from "../../lib/trpc";
import * as service from "./academic-years.service";
import { baseSchema, updateSchema, idSchema, listSchema, setActiveSchema } from "./academic-years.zod";

export const router = createRouter({
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
