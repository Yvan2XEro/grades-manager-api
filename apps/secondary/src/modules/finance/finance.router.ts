import { z } from "zod";
import {
	adminProcedure,
	tenantProcedure,
	router as trpcRouter,
} from "../../lib/trpc";
import * as service from "./finance.service";
import {
	createFeeScheduleSchema,
	idSchema,
	listPaymentsSchema,
	listSchedulesSchema,
	recordPaymentSchema,
} from "./finance.zod";

export const router = trpcRouter({
	listSchedules: tenantProcedure
		.input(listSchedulesSchema)
		.query(({ ctx, input }) =>
			service.listSchedules(ctx.institution.id, input),
		),

	createSchedule: adminProcedure
		.input(createFeeScheduleSchema)
		.mutation(({ ctx, input }) =>
			service.createSchedule(input as any, ctx.institution.id),
		),

	getSchedule: tenantProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getSchedule(input.id, ctx.institution.id),
		),

	listPayments: tenantProcedure
		.input(listPaymentsSchema)
		.query(({ ctx, input }) => service.listPayments(ctx.institution.id, input)),

	recordPayment: adminProcedure
		.input(recordPaymentSchema)
		.mutation(({ ctx, input }) =>
			service.recordPayment(
				{
					...input,
					paidAt: input.paidAt ?? new Date(),
				} as any,
				ctx.institution.id,
			),
		),

	getBalance: tenantProcedure
		.input(z.object({ enrollmentId: z.string().uuid() }))
		.query(({ ctx, input }) =>
			service.getEnrollmentBalance(ctx.institution.id, input.enrollmentId),
		),
});
