import type { Context } from "@/lib/context";
import {
	assertCanReadClass,
	assertCanReadClassCourse,
	assertCanReadCourse,
	assertCanReadExam,
	assertCanReadStudent,
	recordActorFromCtx,
} from "@/modules/authz/record-access";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantGradingProcedure,
	tenantProtectedProcedure,
	tenantSuperAdminProcedure,
} from "../../lib/trpc";
import * as service from "./grades.service";
import {
	avgCourseSchema,
	avgExamSchema,
	avgStudentCourseSchema,
	consolidatedSchema,
	correctLockedSchema,
	editLogsSchema,
	exportClassCourseSchema,
	idSchema,
	importCsvSchema,
	listClassCourseSchema,
	listClassSchema,
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
	// Note: these use tenantProtectedProcedure (not tenantGradingProcedure) because
	// delegates (staff) need access — service-level ensureActorCanEditExam enforces authorization.
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
			service.deleteNote(input.id, ctx.institution.id, actorFromCtx(ctx)),
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
	// Audited correction of a locked exam's mark (super admin, with a reason)
	correctLocked: tenantSuperAdminProcedure
		.input(correctLockedSchema)
		.mutation(({ ctx, input }) =>
			service.correctLockedGrade(input, ctx.institution.id, actorFromCtx(ctx)),
		),
	editLogs: tenantAdminProcedure
		.input(editLogsSchema)
		.query(({ ctx, input }) =>
			service.listEditLogs(input.examId, ctx.institution.id),
		),
	exportClassCourseCsv: tenantGradingProcedure
		.input(exportClassCourseSchema)
		.mutation(async ({ ctx, input }) => {
			await assertCanReadClassCourse(
				recordActorFromCtx(ctx),
				input.classCourseId,
				ctx.institution.id,
			);
			return service.exportClassCourseCsv(
				input.classCourseId,
				ctx.institution.id,
			);
		}),
	listByExam: tenantProtectedProcedure
		.input(listExamSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadExam(
				recordActorFromCtx(ctx),
				input.examId,
				ctx.institution.id,
			);
			return service.listByExam(input, ctx.institution.id);
		}),
	listByStudent: tenantProtectedProcedure
		.input(listStudentSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				input.studentId,
				ctx.institution.id,
			);
			return service.listByStudent(input, ctx.institution.id);
		}),
	listByClassCourse: tenantProtectedProcedure
		.input(listClassCourseSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadClassCourse(
				recordActorFromCtx(ctx),
				input.classCourseId,
				ctx.institution.id,
			);
			return service.listByClassCourse(input, ctx.institution.id);
		}),
	listByClass: tenantProtectedProcedure
		.input(listClassSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadClass(
				recordActorFromCtx(ctx),
				input.classId,
				ctx.institution.id,
			);
			return service.listByClass(input, ctx.institution.id);
		}),
	avgForExam: tenantProtectedProcedure
		.input(avgExamSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadExam(
				recordActorFromCtx(ctx),
				input.examId,
				ctx.institution.id,
			);
			return service.avgForExam(input.examId, ctx.institution.id);
		}),
	avgForCourse: tenantProtectedProcedure
		.input(avgCourseSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadCourse(
				recordActorFromCtx(ctx),
				input.courseId,
				ctx.institution.id,
			);
			return service.avgForCourse(input.courseId, ctx.institution.id);
		}),
	avgForStudentInCourse: tenantProtectedProcedure
		.input(avgStudentCourseSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				input.studentId,
				ctx.institution.id,
			);
			return service.avgForStudentInCourse(
				input.studentId,
				input.courseId,
				ctx.institution.id,
			);
		}),
	consolidatedByStudent: tenantProtectedProcedure
		.input(consolidatedSchema)
		.query(async ({ ctx, input }) => {
			await assertCanReadStudent(
				recordActorFromCtx(ctx),
				input.studentId,
				ctx.institution.id,
			);
			return service.getStudentTranscript(
				input.studentId,
				ctx.institution.id,
				input.classId,
			);
		}),
});
