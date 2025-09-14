import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./grades.service";
import {
	avgCourseSchema,
	avgExamSchema,
	avgStudentCourseSchema,
	idSchema,
	listClassCourseSchema,
	listExamSchema,
	listStudentSchema,
	updateSchema,
	upsertSchema,
} from "./grades.zod";

export const router = createRouter({
	upsertNote: protectedProcedure
		.input(upsertSchema)
		.mutation(({ input }) =>
			service.upsertNote(input.studentId, input.examId, input.score),
		),
	updateNote: protectedProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateNote(input.id, input.score)),
	deleteNote: protectedProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteNote(input.id)),
	listByExam: protectedProcedure
		.input(listExamSchema)
		.query(({ input }) => service.listByExam(input)),
	listByStudent: protectedProcedure
		.input(listStudentSchema)
		.query(({ input }) => service.listByStudent(input)),
	listByClassCourse: protectedProcedure
		.input(listClassCourseSchema)
		.query(({ input }) => service.listByClassCourse(input)),
	avgForExam: protectedProcedure
		.input(avgExamSchema)
		.query(({ input }) => service.avgForExam(input.examId)),
	avgForCourse: protectedProcedure
		.input(avgCourseSchema)
		.query(({ input }) => service.avgForCourse(input.courseId)),
	avgForStudentInCourse: protectedProcedure
		.input(avgStudentCourseSchema)
		.query(({ input }) =>
			service.avgForStudentInCourse(input.studentId, input.courseId),
		),
});
