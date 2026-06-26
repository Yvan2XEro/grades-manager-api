import type { FeeAssignmentStatus, FeeGate } from "@/db/schema/app-schema";
import {
	feeConfigProcedure,
	feeManageProcedure,
	feePaymentProcedure,
	protectedProcedure,
	router,
	tenantAdminProcedure,
} from "@/lib/trpc";
import * as service from "./fee-clearance.service";
import {
	addInstallmentSchema,
	assignStudentSchema,
	bulkAssignClassSchema,
	cancelOrderSchema,
	checkGateSchema,
	confirmOrderSchema,
	createFeeStructureSchema,
	createOrderSchema,
	deleteFeeStructureSchema,
	deleteInstallmentSchema,
	deletePaymentSchema,
	exemptStudentSchema,
	getAssignmentSchema,
	getFeeStructureSchema,
	getMyFeeStatusSchema,
	getOrderSchema,
	listAssignmentsSchema,
	listFeeStructuresSchema,
	listOrdersSchema,
	listPaymentsSchema,
	recordPaymentSchema,
	toggleGateSchema,
	updateDiscountSchema,
	updateFeeStructureSchema,
	updateInstallmentSchema,
} from "./fee-clearance.zod";

export const feeClearanceRouter = router({
	// ── Fee Structures ─────────────────────────────────────────────────

	createStructure: feeConfigProcedure
		.input(createFeeStructureSchema)
		.mutation(({ ctx, input }) =>
			service.createFeeStructure(
				ctx.institution.id,
				ctx.profile?.id ?? null,
				input,
			),
		),

	getStructure: feeManageProcedure
		.input(getFeeStructureSchema)
		.query(({ ctx, input }) =>
			service.getFeeStructure(input.id, ctx.institution.id),
		),

	listStructures: feeManageProcedure
		.input(listFeeStructuresSchema)
		.query(({ ctx, input }) =>
			service.listFeeStructures(ctx.institution.id, {
				academicYearId: input.academicYearId,
				programId: input.programId,
				isActive: input.isActive,
			}),
		),

	updateStructure: feeConfigProcedure
		.input(updateFeeStructureSchema)
		.mutation(({ ctx, input }) =>
			service.updateFeeStructure(input.id, ctx.institution.id, input),
		),

	deleteStructure: feeConfigProcedure
		.input(deleteFeeStructureSchema)
		.mutation(({ ctx, input }) =>
			service.deleteFeeStructure(input.id, ctx.institution.id),
		),

	// ── Installments ───────────────────────────────────────────────────

	addInstallment: feeConfigProcedure
		.input(addInstallmentSchema)
		.mutation(({ ctx, input }) =>
			service.addInstallment(ctx.institution.id, input),
		),

	updateInstallment: feeConfigProcedure
		.input(updateInstallmentSchema)
		.mutation(({ ctx, input }) =>
			service.updateInstallment(input.id, ctx.institution.id, input),
		),

	deleteInstallment: feeConfigProcedure
		.input(deleteInstallmentSchema)
		.mutation(({ ctx, input }) =>
			service.deleteInstallment(input.id, ctx.institution.id),
		),

	// ── Assignments ────────────────────────────────────────────────────

	assignStudent: feeManageProcedure
		.input(assignStudentSchema)
		.mutation(({ ctx, input }) =>
			service.assignStudent(ctx.institution.id, ctx.profile?.id ?? null, input),
		),

	bulkAssignClass: feeManageProcedure
		.input(bulkAssignClassSchema)
		.mutation(({ ctx, input }) =>
			service.bulkAssignClass(
				ctx.institution.id,
				ctx.profile?.id ?? null,
				input,
			),
		),

	getAssignment: feeManageProcedure
		.input(getAssignmentSchema)
		.query(({ ctx, input }) =>
			service.getAssignment(input.id, ctx.institution.id),
		),

	listAssignments: feeManageProcedure
		.input(listAssignmentsSchema)
		.query(({ ctx, input }) =>
			service.listAssignments(ctx.institution.id, {
				academicYearId: input.academicYearId,
				status: input.status as FeeAssignmentStatus[] | undefined,
				classId: input.classId,
				search: input.search,
				limit: input.limit,
				offset: input.offset,
			}),
		),

	updateDiscount: feeManageProcedure
		.input(updateDiscountSchema)
		.mutation(({ ctx, input }) =>
			service.updateDiscount(input.assignmentId, ctx.institution.id, {
				discountAmount: input.discountAmount,
				discountReason: input.discountReason,
			}),
		),

	exemptStudent: feeManageProcedure
		.input(exemptStudentSchema)
		.mutation(({ ctx, input }) =>
			service.exemptStudent(
				input.assignmentId,
				ctx.institution.id,
				input.notes,
			),
		),

	// ── Payment Orders ─────────────────────────────────────────────────

	createOrder: feePaymentProcedure
		.input(createOrderSchema)
		.mutation(({ ctx, input }) =>
			service.createOrder(ctx.institution.id, ctx.profile?.id ?? null, input),
		),

	confirmOrder: feePaymentProcedure
		.input(confirmOrderSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required");
			return service.confirmOrder(
				input.orderId,
				ctx.institution.id,
				ctx.profile.id,
				input,
			);
		}),

	cancelOrder: feePaymentProcedure
		.input(cancelOrderSchema)
		.mutation(({ ctx, input }) =>
			service.cancelOrder(input.orderId, ctx.institution.id),
		),

	getOrder: feeManageProcedure
		.input(getOrderSchema)
		.query(({ ctx, input }) =>
			service.getOrder(input.orderId, ctx.institution.id),
		),

	listOrders: feeManageProcedure
		.input(listOrdersSchema)
		.query(({ ctx, input }) => service.listOrders(ctx.institution.id, input)),

	// ── Payments ───────────────────────────────────────────────────────

	recordPayment: feePaymentProcedure
		.input(recordPaymentSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.profile?.id)
				throw new Error("Profile required to record payment");
			return service.recordPayment(ctx.institution.id, ctx.profile.id, input);
		}),

	deletePayment: feePaymentProcedure
		.input(deletePaymentSchema)
		.mutation(({ ctx, input }) =>
			service.deletePayment(input.paymentId, ctx.institution.id),
		),

	listPayments: feeManageProcedure
		.input(listPaymentsSchema)
		.query(({ ctx, input }) =>
			service.listPayments(input.feeAssignmentId, ctx.institution.id),
		),

	// ── Gating ─────────────────────────────────────────────────────────

	listGatingRules: feeManageProcedure.query(({ ctx }) =>
		service.listGatingRules(ctx.institution.id),
	),

	toggleGate: tenantAdminProcedure
		.input(toggleGateSchema)
		.mutation(({ ctx, input }) =>
			service.toggleGate(
				ctx.institution.id,
				ctx.profile?.id ?? null,
				input.gate as FeeGate,
				input.isEnabled,
			),
		),

	checkGate: protectedProcedure
		.input(checkGateSchema)
		.query(({ ctx, input }) => {
			if (!ctx.profile?.id) throw new Error("Profile required to check gate");
			return service.checkGate(
				ctx.institution.id,
				ctx.profile.id,
				input.gate as FeeGate,
				input.academicYearId,
			);
		}),

	// ── Student-facing ─────────────────────────────────────────────────

	myStatus: protectedProcedure
		.input(getMyFeeStatusSchema)
		.query(({ ctx, input }) => {
			if (!ctx.profile?.id) return null;
			return service.getMyFeeStatus(
				ctx.profile.id,
				ctx.institution.id,
				input.academicYearId,
			);
		}),
});
