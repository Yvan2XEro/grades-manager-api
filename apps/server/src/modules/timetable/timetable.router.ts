import { z } from "zod";
import type { DayOfWeek } from "@/db/schema/app-schema";
import {
	router as createRouter,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "@/lib/trpc";
import * as service from "./timetable.service";
import {
	createSessionSchema,
	deleteSessionSchema,
	executeBulkImportSchema,
	listSessionsSchema,
	previewBulkImportSchema,
	updateSessionSchema,
} from "./timetable.zod";

export const router = createRouter({
	create: tenantAdminProcedure
		.input(createSessionSchema)
		.mutation(({ ctx, input }) =>
			service.createSession(
				{ ...input, dayOfWeek: input.dayOfWeek as DayOfWeek },
				ctx.institution.id,
			),
		),

	update: tenantAdminProcedure
		.input(updateSessionSchema)
		.mutation(({ ctx, input }) =>
			service.updateSession(
				{ ...input, dayOfWeek: input.dayOfWeek as DayOfWeek | undefined },
				ctx.institution.id,
			),
		),

	delete: tenantAdminProcedure
		.input(deleteSessionSchema)
		.mutation(({ ctx, input }) =>
			service.deleteSession(input.id, ctx.institution.id),
		),

	list: tenantAdminProcedure.input(listSessionsSchema).query(({ ctx, input }) =>
		service.listSessions(ctx.institution.id, {
			...input,
			dayOfWeek: input.dayOfWeek as DayOfWeek | undefined,
		}),
	),

	myTeacherTimetable: tenantProtectedProcedure
		.input(
			z.object({
				academicYearId: z.string().optional(),
				semesterId: z.string().optional(),
			}),
		)
		.query(({ ctx, input }) => {
			if (!ctx.profile?.id) return [];
			return service.getTeacherTimetable(
				ctx.profile.id,
				ctx.institution.id,
				input.academicYearId,
				input.semesterId,
			);
		}),

	myStudentTimetable: tenantProtectedProcedure
		.input(
			z.object({
				academicYearId: z.string().optional(),
				semesterId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.profile?.id) return [];
			// ctx.profile.id is domainUser.id; studentCourseEnrollments references students.id
			const { getStudentByDomainUserId } = await import(
				"../students/students.service"
			);
			const student = await getStudentByDomainUserId(
				ctx.profile.id,
				ctx.institution.id,
			);
			if (!student) return [];
			return service.getStudentTimetable(
				student.id,
				ctx.institution.id,
				input.academicYearId,
				input.semesterId,
			);
		}),

	previewBulkImport: tenantAdminProcedure
		.input(previewBulkImportSchema)
		.mutation(({ ctx, input }) =>
			service.previewBulkImport(input.rows, ctx.institution.id, input.mode),
		),

	executeBulkImport: tenantAdminProcedure
		.input(executeBulkImportSchema)
		.mutation(({ ctx, input }) =>
			service.executeBulkImport(
				input.rows,
				ctx.institution.id,
				input.skipDuplicates,
				input.mode,
			),
		),
});
