import { z } from "zod";
import {
	feeAssignmentStatuses,
	feeGates,
	feePaymentMethods,
	feePaymentOrderStatuses,
} from "@/db/schema/app-schema";

// ── Fee Structures ────────────────────────────────────────────────────

export const createFeeStructureSchema = z.object({
	academicYearId: z.string(),
	programId: z.string().optional(),
	cycleLevelId: z.string().optional(),
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	totalAmount: z.number().nonnegative(),
	currency: z.string().default("XAF"),
});

export const updateFeeStructureSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(200).optional(),
	description: z.string().optional(),
	totalAmount: z.number().nonnegative().optional(),
	isActive: z.boolean().optional(),
});

export const getFeeStructureSchema = z.object({
	id: z.string(),
});

export const listFeeStructuresSchema = z.object({
	academicYearId: z.string().optional(),
	programId: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const deleteFeeStructureSchema = z.object({
	id: z.string(),
});

// ── Installments ──────────────────────────────────────────────────────

export const addInstallmentSchema = z.object({
	feeStructureId: z.string(),
	label: z.string().min(1).max(100),
	amount: z.number().positive(),
	dueDate: z.string().optional(),
	orderIndex: z.number().int().nonnegative().optional(),
});

export const updateInstallmentSchema = z.object({
	id: z.string(),
	label: z.string().min(1).max(100).optional(),
	amount: z.number().positive().optional(),
	dueDate: z.string().nullable().optional(),
	orderIndex: z.number().int().nonnegative().optional(),
});

export const deleteInstallmentSchema = z.object({
	id: z.string(),
});

// ── Assignments ───────────────────────────────────────────────────────

export const assignStudentSchema = z.object({
	studentId: z.string(),
	academicYearId: z.string(),
	feeStructureId: z.string(),
	discountAmount: z.number().nonnegative().default(0),
	discountReason: z.string().optional(),
	notes: z.string().optional(),
});

export const bulkAssignClassSchema = z.object({
	classId: z.string(),
	feeStructureId: z.string(),
	/** Skip students who already have an assignment for this year. */
	skipExisting: z.boolean().default(true),
});

export const previewBulkAssignSchema = z.object({
	classId: z.string(),
	feeStructureId: z.string(),
});

export const bulkAssignProgramSchema = z.object({
	programId: z.string(),
	academicYearId: z.string(),
	feeStructureId: z.string(),
	skipExisting: z.boolean().default(true),
});

export const previewBulkAssignProgramSchema = z.object({
	programId: z.string(),
	academicYearId: z.string(),
	feeStructureId: z.string(),
});

export const bulkAssignYearSchema = z.object({
	academicYearId: z.string(),
	feeStructureId: z.string(),
	skipExisting: z.boolean().default(true),
});

export const previewBulkAssignYearSchema = z.object({
	academicYearId: z.string(),
	feeStructureId: z.string(),
});

export const bulkAssignStudentsSchema = z.object({
	studentIds: z.array(z.string()).min(1).max(200),
	feeStructureId: z.string(),
	skipExisting: z.boolean().default(true),
});

export const previewBulkAssignStudentsSchema = z.object({
	studentIds: z.array(z.string()).min(1).max(200),
	feeStructureId: z.string(),
});

export const listBatchRunsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

export const updateDiscountSchema = z.object({
	assignmentId: z.string(),
	discountAmount: z.number().nonnegative(),
	discountReason: z.string().optional(),
});

export const exemptStudentSchema = z.object({
	assignmentId: z.string(),
	notes: z.string().optional(),
});

export const getAssignmentSchema = z.object({
	id: z.string(),
});

export const listAssignmentsSchema = z.object({
	academicYearId: z.string().optional(),
	status: z
		.array(z.enum(feeAssignmentStatuses as unknown as [string, ...string[]]))
		.optional(),
	classId: z.string().optional(),
	programId: z.string().optional(),
	search: z.string().optional(),
	limit: z.number().min(1).max(200).default(50),
	offset: z.number().min(0).default(0),
});

export const getMyFeeStatusSchema = z.object({
	academicYearId: z.string().optional(),
});

// ── Payments ──────────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
	feeAssignmentId: z.string(),
	amount: z.number().positive(),
	currency: z.string().default("XAF"),
	paymentDate: z.string(),
	paymentMethod: z.enum(feePaymentMethods as unknown as [string, ...string[]]),
	installmentId: z.string().optional(),
	reference: z.string().optional(),
	notes: z.string().optional(),
});

export const deletePaymentSchema = z.object({
	paymentId: z.string(),
});

export const listPaymentsSchema = z.object({
	feeAssignmentId: z.string(),
});

// ── Payment Orders ────────────────────────────────────────────────────

export const createOrderSchema = z.object({
	feeAssignmentId: z.string(),
	amount: z.number().positive(),
	currency: z.string().default("XAF"),
	/** Installment IDs this order covers (empty = full remaining balance). */
	installmentIds: z.array(z.string()).default([]),
	reference: z.string().optional(),
	notes: z.string().optional(),
	expiresAt: z.string().datetime().optional(),
});

export const confirmOrderSchema = z.object({
	orderId: z.string(),
	paymentDate: z.string(),
	paymentMethod: z.enum(feePaymentMethods as unknown as [string, ...string[]]),
	reference: z.string().optional(),
	notes: z.string().optional(),
});

export const cancelOrderSchema = z.object({
	orderId: z.string(),
});

export const getOrderSchema = z.object({
	orderId: z.string(),
});

export const listOrdersSchema = z.object({
	feeAssignmentId: z.string().optional(),
	status: z
		.enum(feePaymentOrderStatuses as unknown as [string, ...string[]])
		.optional(),
	limit: z.number().min(1).max(200).default(50),
	offset: z.number().min(0).default(0),
});

// ── Bank Import ───────────────────────────────────────────────────────

export const bankImportRowSchema = z.object({
	reference: z.string().min(1),
	amount: z.number().positive(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

export const previewBankImportSchema = z.object({
	rows: z.array(bankImportRowSchema).min(1).max(500),
});

export const applyBankImportSchema = z.object({
	rows: z.array(bankImportRowSchema).min(1).max(500),
	paymentMethod: z
		.enum(feePaymentMethods as unknown as [string, ...string[]])
		.default("bank_transfer"),
	notes: z.string().optional(),
	forceMatchRefs: z.string().array().optional(),
});

// ── Gating ────────────────────────────────────────────────────────────

export const toggleGateSchema = z.object({
	gate: z.enum(feeGates as unknown as [string, ...string[]]),
	isEnabled: z.boolean(),
});

export const checkGateSchema = z.object({
	gate: z.enum(feeGates as unknown as [string, ...string[]]),
	academicYearId: z.string(),
});
