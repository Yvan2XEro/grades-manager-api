import { z } from "zod";
import {
	adminProcedure,
	router as createRouter,
	gradingProcedure,
	protectedProcedure,
} from "@/lib/trpc";
import * as service from "./attendance.service";
import {
	attendanceRatesSchema,
	bulkMarkSchema,
	createSessionSchema,
	deleteSessionSchema,
	eligibilityCheckSchema,
	excuseAbsenceSchema,
	getSessionSchema,
	listSessionsSchema,
	setThresholdSchema,
	updateRecordSchema,
} from "./attendance.zod";

export const router = createRouter({
	/** Create (or get) an attendance session for a classCourse on a date. */
	createSession: gradingProcedure
		.input(createSessionSchema)
		.mutation(({ ctx, input }) =>
			service.createOrGetSession(input, ctx.institution.id, ctx.profile?.id),
		),

	/** Get one session with its full roster of records. */
	getSession: protectedProcedure
		.input(getSessionSchema)
		.query(({ ctx, input }) =>
			service.getSession(input.id, ctx.institution.id),
		),

	/** List sessions (optionally filtered by classCourse, year, date range). */
	listSessions: protectedProcedure
		.input(listSessionsSchema)
		.query(({ ctx, input }) => service.listSessions(ctx.institution.id, input)),

	/** Delete an attendance session (admin only). */
	deleteSession: adminProcedure
		.input(deleteSessionSchema)
		.mutation(({ ctx, input }) =>
			service.deleteSession(input.id, ctx.institution.id),
		),

	/** Replace all records for a session (bulk mark). */
	bulkMark: gradingProcedure
		.input(bulkMarkSchema)
		.mutation(({ ctx, input }) =>
			service.bulkMark(
				input.attendanceSessionId,
				input.records,
				ctx.institution.id,
				ctx.profile?.id,
			),
		),

	/** Update a single student's attendance status. */
	updateRecord: gradingProcedure
		.input(updateRecordSchema)
		.mutation(({ ctx, input }) =>
			service.updateRecord(
				input.attendanceSessionId,
				input.studentId,
				input.status,
				ctx.institution.id,
				ctx.profile?.id,
			),
		),

	/** Approve/set an excuse reason for an absent or late record. */
	excuseAbsence: gradingProcedure
		.input(excuseAbsenceSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.excuseAbsence(
				input.attendanceRecordId,
				input.excuseReason,
				input.approve,
				ctx.institution.id,
				ctx.profile.id,
			);
		}),

	/** Per-student attendance rates for a class course. */
	getAttendanceRates: protectedProcedure
		.input(attendanceRatesSchema)
		.query(({ ctx, input }) =>
			service.getAttendanceRates(
				input.classCourseId,
				ctx.institution.id,
				input.academicYearId,
			),
		),

	/** Active student roster for a class course. */
	getRoster: protectedProcedure
		.input(z.object({ classCourseId: z.string() }))
		.query(({ ctx, input }) =>
			service.getRoster(input.classCourseId, ctx.institution.id),
		),

	/** Check attendance eligibility for a student in a class course. */
	checkEligibility: protectedProcedure
		.input(eligibilityCheckSchema)
		.query(({ ctx, input }) =>
			service.checkAttendanceEligibility(
				input.studentId,
				input.classCourseId,
				ctx.institution.id,
			),
		),

	/** Set or clear the attendance threshold on a class course (admin only). */
	setThreshold: adminProcedure
		.input(setThresholdSchema)
		.mutation(async ({ ctx, input }) => {
			const { db } = await import("@/db");
			const { and, eq } = await import("drizzle-orm");
			const schema = await import("@/db/schema/app-schema");
			const [cc] = await db
				.update(schema.classCourses)
				.set({ attendanceThreshold: input.threshold })
				.where(
					and(
						eq(schema.classCourses.id, input.classCourseId),
						eq(schema.classCourses.institutionId, ctx.institution.id),
					),
				)
				.returning({ id: schema.classCourses.id });
			if (!cc) throw new Error("Class course not found");
			return { success: true };
		}),
});
