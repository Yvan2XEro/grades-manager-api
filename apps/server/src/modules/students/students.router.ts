import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./students.service";
import {
	baseSchema,
	bulkCreateSchema,
	idSchema,
	listSchema,
	updateSchema,
} from "./students.zod";

export const studentsRouter = router({
	create: adminProcedure.input(baseSchema).mutation(({ input }) =>
		service.createStudent({
			classId: input.classId,
			registrationNumber: input.registrationNumber,
			profile: input.profile,
		}),
	),
	update: adminProcedure
		.input(updateSchema)
		.mutation(({ input }) =>
			service.updateStudent(input.id, {
				classId: input.classId,
				registrationNumber: input.registrationNumber,
				profile: input.profile,
			}),
		),
	bulkCreate: adminProcedure
		.input(bulkCreateSchema)
		.mutation(({ input }) =>
			service.bulkCreateStudents({
				classId: input.classId,
				students: input.students.map((student) => ({
					registrationNumber: student.registrationNumber,
					profile: {
						firstName: student.firstName,
						lastName: student.lastName,
						email: student.email,
						dateOfBirth: student.dateOfBirth,
						placeOfBirth: student.placeOfBirth,
						gender: student.gender,
						phone: student.phone,
						nationality: student.nationality,
						authUserId: student.authUserId,
					},
				})),
			}),
		),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listStudents(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getStudentById(input.id)),
});
