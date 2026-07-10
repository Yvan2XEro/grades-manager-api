import { z } from "zod";
import type { DayOfWeek } from "@/db/schema/app-schema";
import {
	adminProcedure,
	router as createRouter,
	protectedProcedure,
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
	create: adminProcedure
		.input(createSessionSchema)
		.mutation(({ ctx, input }) =>
			service.createSession(
				{ ...input, dayOfWeek: input.dayOfWeek as DayOfWeek },
				ctx.institution.id,
			),
		),

	update: adminProcedure
		.input(updateSessionSchema)
		.mutation(({ ctx, input }) =>
			service.updateSession(
				{ ...input, dayOfWeek: input.dayOfWeek as DayOfWeek | undefined },
				ctx.institution.id,
			),
		),

	delete: adminProcedure
		.input(deleteSessionSchema)
		.mutation(({ ctx, input }) =>
			service.deleteSession(input.id, ctx.institution.id),
		),

	list: adminProcedure.input(listSessionsSchema).query(({ ctx, input }) =>
		service.listSessions(ctx.institution.id, {
			...input,
			dayOfWeek: input.dayOfWeek as DayOfWeek | undefined,
		}),
	),

	myTeacherTimetable: protectedProcedure
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

	myStudentTimetable: protectedProcedure
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

	previewBulkImport: adminProcedure
		.input(previewBulkImportSchema)
		.mutation(({ ctx, input }) =>
			service.previewBulkImport(input.rows, ctx.institution.id, input.mode),
		),

	executeBulkImport: adminProcedure
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
