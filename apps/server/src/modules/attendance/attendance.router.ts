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
	grantExemptionSchema,
	listSessionsSchema,
	revokeExemptionSchema,
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
		.query(async ({ ctx, input }) => {
			const session = await service.getSession(input.id, ctx.institution.id);
			if (!ctx.permissions.canManageCatalog) {
				await assertTeacherOwnsCourse(
					session.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return session;
		}),

	/** List sessions (optionally filtered by classCourse, year, date range).
	 *  Non-admin callers must supply classCourseId and must own that course. */
	listSessions: gradingProcedure
		.input(listSessionsSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				if (!input.classCourseId)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "classCourseId is required for non-admin callers",
					});
				await assertTeacherOwnsCourse(
					input.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.listSessions(ctx.institution.id, input);
		}),

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
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				await assertTeacherOwnsCourse(
					input.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.getAttendanceRates(
				input.classCourseId,
				ctx.institution.id,
				{
					academicYearId: input.academicYearId,
					dateFrom: input.dateFrom,
					dateTo: input.dateTo,
				},
			);
		}),

	/** Active student roster for a class course. */
	getRoster: gradingProcedure
		.input(z.object({ classCourseId: z.string() }))
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				await assertTeacherOwnsCourse(
					input.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.getRoster(input.classCourseId, ctx.institution.id);
		}),

	/** Check attendance eligibility for a student in a class course.
	 *  Teachers may only check students enrolled in their own courses. */
	checkEligibility: gradingProcedure
		.input(eligibilityCheckSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.permissions.canManageCatalog) {
				await assertTeacherOwnsCourse(
					input.classCourseId,
					ctx.institution.id,
					ctx.profile!.id,
				);
			}
			return service.checkAttendanceEligibility(
				input.studentId,
				input.classCourseId,
				ctx.institution.id,
			);
		}),

	/** Set or clear the attendance threshold and excused-absence policy on a class course (admin only). */
	setThreshold: adminProcedure
		.input(setThresholdSchema)
		.mutation(async ({ ctx, input }) => {
			const { db } = await import("@/db");
			const { and, eq } = await import("drizzle-orm");
			const schema = await import("@/db/schema/app-schema");
			const patch: Record<string, unknown> = {
				attendanceThreshold: input.threshold,
			};
			if (input.excusedCountsAsAbsent !== undefined)
				patch.attendanceExcusedCountsAsAbsent = input.excusedCountsAsAbsent;
			const [cc] = await db
				.update(schema.classCourses)
				.set(patch)
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

	/** Grant an attendance exemption so a below-threshold student can sit exams (admin only). */
	grantExemption: adminProcedure
		.input(grantExemptionSchema)
		.mutation(({ ctx, input }) =>
			service.grantExemption(
				input.classCourseId,
				input.studentId,
				input.reason,
				ctx.institution.id,
				ctx.profile?.id ?? null,
			),
		),

	/** Revoke a previously-granted attendance exemption (admin only). */
	revokeExemption: adminProcedure
		.input(revokeExemptionSchema)
		.mutation(({ ctx, input }) =>
			service.revokeExemption(
				input.classCourseId,
				input.studentId,
				ctx.institution.id,
				ctx.profile?.id ?? null,
			),
		),

	/** Summary of attendance rates across all class courses assigned to the calling teacher.
	 *  Teachers use this to review their own courses without admin navigation. */
	myCoursesRates: gradingProcedure
		.input(z.object({ academicYearId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			if (!ctx.profile?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
			const { db } = await import("@/db");
			const { and, eq } = await import("drizzle-orm");
			const schema = await import("@/db/schema/app-schema");
			const courses = await db.query.classCourses.findMany({
				where: and(
					eq(schema.classCourses.institutionId, ctx.institution.id),
					eq(schema.classCourses.teacher, ctx.profile.id),
				),
				with: {
					classRef: { columns: { name: true, academicYear: true } },
					courseRef: { columns: { name: true, code: true } },
				},
				columns: {
					id: true,
					attendanceThreshold: true,
					attendanceExcusedCountsAsAbsent: true,
				},
			});
			const results = await Promise.all(
				courses.map(async (cc) => {
					const rates = await service.getAttendanceRates(
						cc.id,
						ctx.institution.id,
						{ academicYearId: input.academicYearId },
					);
					const belowThreshold =
						cc.attendanceThreshold != null
							? rates.students.filter(
									(s) => s.rate < (cc.attendanceThreshold as number),
								).length
							: 0;
					return {
						classCourseId: cc.id,
						className: cc.classRef?.name ?? null,
						courseName: cc.courseRef?.name ?? null,
						courseCode: cc.courseRef?.code ?? null,
						academicYear: cc.classRef?.academicYear ?? null,
						totalSessions: rates.totalSessions,
						threshold: cc.attendanceThreshold,
						excusedCountsAsAbsent: cc.attendanceExcusedCountsAsAbsent,
						belowThreshold,
					};
				}),
			);
			return results;
		}),
});
