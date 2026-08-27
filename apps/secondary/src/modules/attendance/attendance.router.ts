import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./attendance.service";
import {
	batchRecordSchema,
	createSessionSchema,
	getSessionSchema,
	listSessionsSchema,
	recordSchema,
	sessionRecordsSchema,
	studentHistorySchema,
	updateRecordSchema,
} from "./attendance.zod";

export const router = trpcRouter({
	// ─── Sessions ──────────────────────────────────────────────────────────

	listSessions: tenantProcedure
		.input(listSessionsSchema)
		.query(({ ctx, input }) =>
			service.listSessions(ctx.institution.id, input.classId, {
				termId: input.termId,
				startDate: input.startDate,
				endDate: input.endDate,
			}),
		),

	getSession: tenantProcedure
		.input(getSessionSchema)
		.query(({ ctx, input }) =>
			service.getSession(input.sessionId, ctx.institution.id),
		),

	createSession: adminProcedure
		.input(createSessionSchema)
		.mutation(({ ctx, input }) =>
			service.createSession(input, ctx.institution.id),
		),

	updateSession: adminProcedure
		.input(
			createSessionSchema.partial().extend({
				sessionId: createSessionSchema.shape.classId,
			}),
		)
		.mutation(({ ctx, input }) => {
			const { sessionId, ...data } = input;
			return service.updateSession(sessionId, ctx.institution.id, data);
		}),

	deleteSession: adminProcedure
		.input(getSessionSchema)
		.mutation(({ ctx, input }) =>
			service.deleteSession(input.sessionId, ctx.institution.id),
		),

	// ─── Records ────────────────────────────────────────────────────────────

	getSessionRecords: tenantProcedure
		.input(sessionRecordsSchema)
		.query(({ ctx, input }) =>
			service.getSessionRecords(input.sessionId, ctx.institution.id),
		),

	recordAttendance: adminProcedure
		.input(recordSchema)
		.mutation(({ ctx, input }) =>
			service.recordAttendance(input, ctx.institution.id),
		),

	batchRecordAttendance: adminProcedure
		.input(batchRecordSchema)
		.mutation(({ ctx, input }) =>
			service.batchRecordAttendance(input, ctx.institution.id),
		),

	updateAttendanceRecord: adminProcedure
		.input(updateRecordSchema)
		.mutation(({ ctx, input }) => {
			const { recordId, ...data } = input;
			return service.updateAttendanceRecord(recordId, ctx.institution.id, data);
		}),

	deleteAttendanceRecord: adminProcedure
		.input(
			updateRecordSchema.pick({ recordId: true }).extend({
				recordId: updateRecordSchema.shape.recordId,
			}),
		)
		.mutation(({ ctx, input }) =>
			service.deleteAttendanceRecord(input.recordId, ctx.institution.id),
		),

	// ─── Queries ────────────────────────────────────────────────────────────

	studentHistory: tenantProcedure
		.input(studentHistorySchema)
		.query(({ ctx, input }) =>
			service.getStudentHistory(input.studentId, ctx.institution.id, {
				classId: input.classId,
				startDate: input.startDate,
				endDate: input.endDate,
			}),
		),
});
