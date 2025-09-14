import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./students.service";
import { baseSchema, bulkCreateSchema, idSchema, listSchema, updateSchema } from "./students.zod";

export const studentsRouter = router({
  create: adminProcedure.input(baseSchema).mutation(({ input }) => service.createStudent({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    registrationNumber: input.registrationNumber,
    class: input.classId,
  })),
  update: adminProcedure.input(updateSchema).mutation(({ input }) => service.updateStudent(input.id, input)),
  bulkCreate: adminProcedure
    .input(bulkCreateSchema)
    .mutation(({ input }) =>
      service.bulkCreateStudents({
        classId: input.classId,
        students: input.students,
      }),
    ),
  list: protectedProcedure.input(listSchema).query(({ input }) => service.listStudents(input)),
  getById: protectedProcedure.input(idSchema).query(({ input }) => service.getStudentById(input.id)),
});
