import type { Context } from "@/lib/context";
import {
	router as createRouter,
	tenantGradingProcedure,
	tenantProtectedProcedure,
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

const actorFromCtx = (ctx: Context) => ({
	profileId: ctx.profile?.id ?? null,
	memberRole: ctx.memberRole ?? null,
});

export const router = createRouter({
	upsertNote: tenantProtectedProcedure
		.input(upsertSchema)
		.mutation(({ ctx, input }) =>
			service.upsertNote(
				input.studentId,
				input.examId,
				input.score,
				ctx.institution.id,
				actorFromCtx(ctx),
			),
		),
	updateNote: tenantProtectedProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) =>
			service.updateNote(
				input.id,
				input.score,
				ctx.institution.id,
				actorFromCtx(ctx),
			),
		),
	deleteNote: tenantProtectedProcedure
		.input(idSchema)
		.mutation(({ ctx, input }) =>
			service.deleteNote(
				input.id,
				ctx.institution.id,
				actorFromCtx(ctx),
			),
		),
	importCsv: tenantProtectedProcedure
		.input(importCsvSchema)
		.mutation(({ ctx, input }) =>
			service.importGradesFromCsv(
				input.examId,
				input.csv,
				ctx.institution.id,
				actorFromCtx(ctx),
			),
		),
	exportClassCourseCsv: tenantGradingProcedure
		.input(exportClassCourseSchema)
		.mutation(({ ctx, input }) =>
			service.exportClassCourseCsv(input.classCourseId, ctx.institution.id),
		),
	listByExam: tenantProtectedProcedure
		.input(listExamSchema)
		.query(({ ctx, input }) => service.listByExam(input, ctx.institution.id)),
	listByStudent: tenantProtectedProcedure
		.input(listStudentSchema)
		.query(({ ctx, input }) =>
			service.listByStudent(input, ctx.institution.id),
		),
	listByClassCourse: tenantProtectedProcedure
		.input(listClassCourseSchema)
		.query(({ ctx, input }) =>
			service.listByClassCourse(input, ctx.institution.id),
		),
	avgForExam: tenantProtectedProcedure
		.input(avgExamSchema)
		.query(({ ctx, input }) =>
			service.avgForExam(input.examId, ctx.institution.id),
		),
	avgForCourse: tenantProtectedProcedure
		.input(avgCourseSchema)
		.query(({ ctx, input }) =>
			service.avgForCourse(input.courseId, ctx.institution.id),
		),
	avgForStudentInCourse: tenantProtectedProcedure
		.input(avgStudentCourseSchema)
		.query(({ ctx, input }) =>
			service.avgForStudentInCourse(
				input.studentId,
				input.courseId,
				ctx.institution.id,
			),
		),
	consolidatedByStudent: tenantProtectedProcedure
		.input(consolidatedSchema)
		.query(({ ctx, input }) =>
			service.getStudentTranscript(input.studentId, ctx.institution.id),
		),
});
