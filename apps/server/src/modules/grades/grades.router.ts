import {
	router as createRouter,
	gradingProcedure,
	protectedProcedure,
} from "../../lib/trpc";
import * as service from "./grades.service";
import {
	avgCourseSchema,
	avgExamSchema,
	avgStudentCourseSchema,
	consolidatedSchema,
	exportClassCourseSchema,
	idSchema,
	importCsvSchema,
	listClassCourseSchema,
	listExamSchema,
	listStudentSchema,
	updateSchema,
	upsertSchema,
} from "./grades.zod";

export const router = createRouter({
	upsertNote: gradingProcedure
		.input(upsertSchema)
		.mutation(({ input }) =>
			service.upsertNote(input.studentId, input.examId, input.score),
		),
	updateNote: gradingProcedure
		.input(updateSchema)
		.mutation(({ input }) => service.updateNote(input.id, input.score)),
	deleteNote: gradingProcedure
		.input(idSchema)
		.mutation(({ input }) => service.deleteNote(input.id)),
	importCsv: gradingProcedure
		.input(importCsvSchema)
		.mutation(({ input }) =>
			service.importGradesFromCsv(input.examId, input.csv),
		),
	exportClassCourseCsv: gradingProcedure
		.input(exportClassCourseSchema)
		.mutation(({ input }) => service.exportClassCourseCsv(input.classCourseId)),
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
	consolidatedByStudent: protectedProcedure
		.input(consolidatedSchema)
		.query(({ input }) => service.getStudentTranscript(input.studentId)),
});
