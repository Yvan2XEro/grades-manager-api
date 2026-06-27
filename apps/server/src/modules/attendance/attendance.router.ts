import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	adminProcedure,
	router as createRouter,
	gradingProcedure,
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

/** Verify the requesting teacher is assigned to the classCourse.
 *  Admins (canManageCatalog) bypass this check. */
async function assertTeacherOwnsCourse(
	classCourseId: string,
	institutionId: string,
	profileId: string,
) {
	const { db } = await import("@/db");
	const { and, eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const cc = await db.query.classCourses.findFirst({
		where: and(
			eq(schema.classCourses.id, classCourseId),
			eq(schema.classCourses.institutionId, institutionId),
		),
		columns: { teacher: true },
	});
	if (!cc || cc.teacher !== profileId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned as teacher for this class course",
		});
	}
}

export const router = createRouter({
	/** Create (or get) an attendance session for a classCourse on a date. */
	createSession: gradingProcedure
		.input(createSessionSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				await assertTeacherOwnsCourse(
					input.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.createOrGetSession(
				input,
				ctx.institution.id,
				ctx.profile?.id,
			);
		}),

	/** Get one session with its full roster of records. */
	getSession: gradingProcedure
		.input(getSessionSchema)
		.query(({ ctx, input }) =>
			service.getSession(input.id, ctx.institution.id),
		),

	/** List sessions (optionally filtered by classCourse, year, date range). */
	listSessions: gradingProcedure
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
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				const session = await service.getSession(
					input.attendanceSessionId,
					ctx.institution.id,
				);
				await assertTeacherOwnsCourse(
					session.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.bulkMark(
				input.attendanceSessionId,
				input.records,
				ctx.institution.id,
				ctx.profile?.id,
			);
		}),

	/** Update a single student's attendance status. */
	updateRecord: gradingProcedure
		.input(updateRecordSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				const session = await service.getSession(
					input.attendanceSessionId,
					ctx.institution.id,
				);
				await assertTeacherOwnsCourse(
					session.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.updateRecord(
				input.attendanceSessionId,
				input.studentId,
				input.status,
				ctx.institution.id,
				ctx.profile?.id,
			);
		}),

	/** Approve/set an excuse reason for an absent or late record. */
	excuseAbsence: gradingProcedure
		.input(excuseAbsenceSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.profile?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
			if (!ctx.permissions.canManageCatalog) {
				const record = await service.getAttendanceRecordById(
					input.attendanceRecordId,
					ctx.institution.id,
				);
				await assertTeacherOwnsCourse(
					record.attendanceSession.classCourseId,
					ctx.institution.id,
					ctx.profile.id,
				);
			}
			return service.excuseAbsence(
				input.attendanceRecordId,
				input.excuseReason,
				input.approve,
				ctx.institution.id,
				ctx.profile.id,
			);
		}),

	/** Per-student attendance rates for a class course. */
	getAttendanceRates: gradingProcedure
		.input(attendanceRatesSchema)
		.query(({ ctx, input }) =>
			service.getAttendanceRates(
				input.classCourseId,
				ctx.institution.id,
				input.academicYearId,
			),
		),

	/** Active student roster for a class course. */
	getRoster: gradingProcedure
		.input(z.object({ classCourseId: z.string() }))
		.query(({ ctx, input }) =>
			service.getRoster(input.classCourseId, ctx.institution.id),
		),

	/** Check attendance eligibility for a student in a class course. */
	checkEligibility: gradingProcedure
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
			if (!cc) throw new TRPCError({ code: "NOT_FOUND" });
			return { success: true };
		}),
});
