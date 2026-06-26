import { TRPCError } from "@trpc/server";
import type { FeeAssignmentStatus, FeeGate } from "@/db/schema/app-schema";
import { conflict, notFound } from "../_shared/errors";
import * as repo from "./fee-clearance.repo";

// ── Helpers ───────────────────────────────────────────────────────────

function computeStatus(
	paidAmount: number,
	effectiveAmount: number,
): FeeAssignmentStatus {
	if (paidAmount <= 0) return "unpaid";
	if (paidAmount >= effectiveAmount) return "paid";
	return "partial";
}

async function recalculateAssignmentStatus(
	assignmentId: string,
	institutionId: string,
) {
	const assignment = await repo.findAssignmentById(assignmentId, institutionId);
	if (!assignment) return;
	if (assignment.status === "exempt") return;

	const paidAmount = await repo.sumPayments(assignmentId);
	const effectiveAmount = Number(assignment.effectiveAmount);
	const newStatus = computeStatus(paidAmount, effectiveAmount);
	const clearedAt =
		newStatus === "paid" ? (assignment.clearedAt ?? new Date()) : null;

	await repo.updateAssignment(assignmentId, institutionId, {
		status: newStatus,
		clearedAt,
	});
}

// ── Fee Structures ────────────────────────────────────────────────────

export async function createFeeStructure(
	institutionId: string,
	createdBy: string | null,
	input: {
		academicYearId: string;
		programId?: string;
		cycleLevelId?: string;
		name: string;
		description?: string;
		totalAmount: number;
		currency: string;
	},
) {
	const { db } = await import("@/db");
	const { eq, and } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, input.academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) throw notFound("Academic year not found for this institution");

	if (input.programId) {
		const program = await db.query.programs.findFirst({
			where: and(
				eq(schema.programs.id, input.programId),
				eq(schema.programs.institutionId, institutionId),
			),
		});
		if (!program) throw notFound("Program not found for this institution");
	}

	if (input.cycleLevelId) {
		const cycleLevel = await db.query.cycleLevels.findFirst({
			where: eq(schema.cycleLevels.id, input.cycleLevelId),
			with: { cycle: true },
		});
		if (!cycleLevel || cycleLevel.cycle.institutionId !== institutionId)
			throw notFound("Cycle level not found for this institution");
	}

	return repo.createFeeStructure({
		institutionId,
		academicYearId: input.academicYearId,
		programId: input.programId ?? null,
		cycleLevelId: input.cycleLevelId ?? null,
		name: input.name,
		description: input.description ?? null,
		totalAmount: String(input.totalAmount),
		currency: input.currency,
		createdBy: createdBy ?? null,
	});
}

export async function getFeeStructure(id: string, institutionId: string) {
	const row = await repo.findFeeStructureById(id, institutionId);
	if (!row) throw notFound("Fee structure not found");
	return row;
}

export async function listFeeStructures(
	institutionId: string,
	opts: { academicYearId?: string; programId?: string; isActive?: boolean },
) {
	return repo.listFeeStructures(institutionId, opts);
}

export async function updateFeeStructure(
	id: string,
	institutionId: string,
	input: {
		name?: string;
		description?: string;
		totalAmount?: number;
		isActive?: boolean;
	},
) {
	const row = await repo.findFeeStructureById(id, institutionId);
	if (!row) throw notFound("Fee structure not found");

	return repo.updateFeeStructure(id, institutionId, {
		...(input.name !== undefined && { name: input.name }),
		...(input.description !== undefined && { description: input.description }),
		...(input.totalAmount !== undefined && {
			totalAmount: String(input.totalAmount),
		}),
		...(input.isActive !== undefined && { isActive: input.isActive }),
	});
}

export async function deleteFeeStructure(id: string, institutionId: string) {
	const row = await repo.findFeeStructureById(id, institutionId);
	if (!row) throw notFound("Fee structure not found");
	return repo.deleteFeeStructure(id, institutionId);
}

// ── Installments ──────────────────────────────────────────────────────

export async function addInstallment(
	institutionId: string,
	input: {
		feeStructureId: string;
		label: string;
		amount: number;
		dueDate?: string;
		orderIndex?: number;
	},
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const nextIndex =
		input.orderIndex ??
		(structure.installments?.length
			? Math.max(...structure.installments.map((i) => i.orderIndex)) + 1
			: 0);

	return repo.addInstallment({
		feeStructureId: input.feeStructureId,
		label: input.label,
		amount: String(input.amount),
		dueDate: input.dueDate ?? null,
		orderIndex: nextIndex,
	});
}

export async function updateInstallment(
	id: string,
	institutionId: string,
	input: {
		label?: string;
		amount?: number;
		dueDate?: string | null;
		orderIndex?: number;
	},
) {
	const row = await repo.findInstallmentById(id);
	if (!row || row.feeStructure.institutionId !== institutionId)
		throw notFound("Installment not found");

	return repo.updateInstallment(id, {
		...(input.label !== undefined && { label: input.label }),
		...(input.amount !== undefined && { amount: String(input.amount) }),
		...(input.dueDate !== undefined && { dueDate: input.dueDate }),
		...(input.orderIndex !== undefined && { orderIndex: input.orderIndex }),
	});
}

export async function deleteInstallment(id: string, institutionId: string) {
	const row = await repo.findInstallmentById(id);
	if (!row || row.feeStructure.institutionId !== institutionId)
		throw notFound("Installment not found");
	return repo.deleteInstallment(id);
}

// ── Assignments ───────────────────────────────────────────────────────

export async function assignStudent(
	institutionId: string,
	createdBy: string | null,
	input: {
		studentId: string;
		academicYearId: string;
		feeStructureId: string;
		discountAmount: number;
		discountReason?: string;
		notes?: string;
	},
) {
	const { db } = await import("@/db");
	const { eq, and } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const student = await db.query.students.findFirst({
		where: and(
			eq(schema.students.id, input.studentId),
			eq(schema.students.institutionId, institutionId),
		),
	});
	if (!student) throw notFound("Student not found for this institution");

	const year = await db.query.academicYears.findFirst({
		where: and(
			eq(schema.academicYears.id, input.academicYearId),
			eq(schema.academicYears.institutionId, institutionId),
		),
	});
	if (!year) throw notFound("Academic year not found for this institution");

	const existing = await repo.findAssignmentForStudent(
		input.studentId,
		input.academicYearId,
		institutionId,
	);
	if (existing)
		throw conflict(
			"Student already has a fee assignment for this academic year",
		);

	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const effectiveAmount = Number(structure.totalAmount) - input.discountAmount;
	if (effectiveAmount < 0)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Discount cannot exceed the total fee amount",
		});

	return repo.createAssignment({
		institutionId,
		studentId: input.studentId,
		academicYearId: input.academicYearId,
		feeStructureId: input.feeStructureId,
		effectiveAmount: String(effectiveAmount),
		currency: structure.currency,
		discountAmount: String(input.discountAmount),
		discountReason: input.discountReason ?? null,
		notes: input.notes ?? null,
		status: "unpaid",
		createdBy: createdBy ?? null,
	});
}

export async function bulkAssignClass(
	institutionId: string,
	createdBy: string | null,
	input: {
		classId: string;
		feeStructureId: string;
		skipExisting: boolean;
	},
) {
	const klass = await repo.findClassById(input.classId, institutionId);
	if (!klass) throw notFound("Class not found");

	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const students = await repo.findStudentsByClass(input.classId);
	if (students.length === 0) return { assigned: 0, skipped: 0 };

	let assigned = 0;
	let skipped = 0;

	for (const student of students) {
		const existing = await repo.findAssignmentForStudent(
			student.id,
			structure.academicYearId,
			institutionId,
		);
		if (existing) {
			if (input.skipExisting) {
				skipped++;
				continue;
			}
			// overwrite not supported in bulk — skip with error note
			skipped++;
			continue;
		}

		await repo.createAssignment({
			institutionId,
			studentId: student.id,
			academicYearId: structure.academicYearId,
			feeStructureId: structure.id,
			effectiveAmount: structure.totalAmount,
			currency: structure.currency,
			discountAmount: "0",
			status: "unpaid",
			createdBy: createdBy ?? null,
		});
		assigned++;
	}

	return { assigned, skipped };
}

export async function getAssignment(id: string, institutionId: string) {
	const row = await repo.findAssignmentById(id, institutionId);
	if (!row) throw notFound("Fee assignment not found");
	return row;
}

export async function listAssignments(
	institutionId: string,
	opts: {
		academicYearId?: string;
		status?: FeeAssignmentStatus[];
		classId?: string;
		search?: string;
		limit?: number;
		offset?: number;
	},
) {
	return repo.listAssignments(institutionId, opts);
}

export async function updateDiscount(
	id: string,
	institutionId: string,
	input: { discountAmount: number; discountReason?: string },
) {
	const assignment = await repo.findAssignmentById(id, institutionId);
	if (!assignment) throw notFound("Fee assignment not found");
	if (assignment.status === "exempt")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Cannot update discount on an exempted assignment",
		});

	const structure = await repo.findFeeStructureById(
		assignment.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const totalAmount = Number(structure.totalAmount);
	if (input.discountAmount > totalAmount)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Discount cannot exceed the total fee amount",
		});

	const effectiveAmount = totalAmount - input.discountAmount;

	await repo.updateAssignment(id, institutionId, {
		discountAmount: String(input.discountAmount),
		discountReason: input.discountReason ?? null,
		effectiveAmount: String(effectiveAmount),
	});

	await recalculateAssignmentStatus(id, institutionId);
	return repo.findAssignmentById(id, institutionId);
}

export async function exemptStudent(
	id: string,
	institutionId: string,
	notes?: string,
) {
	const assignment = await repo.findAssignmentById(id, institutionId);
	if (!assignment) throw notFound("Fee assignment not found");

	await repo.updateAssignment(id, institutionId, {
		status: "exempt",
		clearedAt: new Date(),
		...(notes !== undefined && { notes }),
	});
	return repo.findAssignmentById(id, institutionId);
}

// ── Payments ──────────────────────────────────────────────────────────

export async function recordPayment(
	institutionId: string,
	recordedBy: string,
	input: {
		feeAssignmentId: string;
		amount: number;
		currency: string;
		paymentDate: string;
		paymentMethod: string;
		installmentId?: string;
		reference?: string;
		notes?: string;
	},
) {
	const assignment = await repo.findAssignmentById(
		input.feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");
	if (assignment.status === "exempt")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Cannot record payment for an exempted assignment",
		});

	const paid = await repo.sumPayments(input.feeAssignmentId);
	const effective = Number(assignment.effectiveAmount);
	if (paid >= effective)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Assignment is already fully paid",
		});
	if (paid + input.amount > effective)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Payment amount (${input.amount}) exceeds remaining balance (${effective - paid})`,
		});

	const payment = await repo.recordPayment({
		institutionId,
		feeAssignmentId: input.feeAssignmentId,
		installmentId: input.installmentId ?? null,
		amount: String(input.amount),
		currency: input.currency,
		paymentDate: input.paymentDate,
		paymentMethod: input.paymentMethod as never,
		reference: input.reference ?? null,
		notes: input.notes ?? null,
		recordedBy,
	});

	await recalculateAssignmentStatus(input.feeAssignmentId, institutionId);
	return payment;
}

export async function deletePayment(paymentId: string, institutionId: string) {
	const payment = await repo.findPaymentById(paymentId);
	if (!payment || payment.feeAssignment.institutionId !== institutionId)
		throw notFound("Payment not found");

	const deleted = await repo.deletePayment(paymentId);
	await recalculateAssignmentStatus(payment.feeAssignmentId, institutionId);
	return deleted;
}

export async function listPayments(
	feeAssignmentId: string,
	institutionId: string,
) {
	const assignment = await repo.findAssignmentById(
		feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");
	return repo.listPayments(feeAssignmentId);
}

// ── Payment Orders ────────────────────────────────────────────────────

export async function createOrder(
	institutionId: string,
	createdBy: string | null,
	input: {
		feeAssignmentId: string;
		amount: number;
		currency: string;
		installmentIds: string[];
		reference?: string;
		notes?: string;
		expiresAt?: string;
	},
) {
	const assignment = await repo.findAssignmentById(
		input.feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");
	if (assignment.status === "exempt")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Cannot create order for an exempted assignment",
		});
	if (assignment.status === "paid")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Assignment is already fully paid",
		});

	const alreadyPaid = await repo.sumPayments(input.feeAssignmentId);
	const remaining = Number(assignment.effectiveAmount) - alreadyPaid;
	if (input.amount > remaining)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Order amount (${input.amount}) exceeds remaining balance (${remaining})`,
		});

	return repo.createOrder({
		institutionId,
		feeAssignmentId: input.feeAssignmentId,
		amount: String(input.amount),
		currency: input.currency,
		installmentIds: input.installmentIds,
		reference: input.reference ?? null,
		notes: input.notes ?? null,
		expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
		createdBy: createdBy ?? null,
		status: "pending",
	});
}

export async function confirmOrder(
	orderId: string,
	institutionId: string,
	confirmedBy: string,
	input: {
		paymentDate: string;
		paymentMethod: string;
		reference?: string;
		notes?: string;
	},
) {
	const order = await repo.findOrderById(orderId, institutionId);
	if (!order) throw notFound("Payment order not found");
	if (order.status !== "pending")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Order is already ${order.status}`,
		});
	if (order.expiresAt && new Date(order.expiresAt) < new Date())
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Payment order has expired and can no longer be confirmed",
		});

	// Re-check remaining balance to guard against concurrent payments/orders.
	const assignment = await repo.findAssignmentById(
		order.feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");
	const alreadyPaid = await repo.sumPayments(order.feeAssignmentId);
	const remaining = Number(assignment.effectiveAmount) - alreadyPaid;
	if (Number(order.amount) > remaining)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Order amount exceeds remaining balance (${remaining}). Another payment may have been recorded concurrently.`,
		});

	// Update order status and create payment atomically so a partial failure
	// never leaves an order "confirmed" without a corresponding payment row.
	const { db } = await import("@/db");
	const { eq, and } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const now = new Date();
	const { updatedOrder, payment } = await db.transaction(async (tx) => {
		const [updatedOrder] = await tx
			.update(schema.feePaymentOrders)
			.set({ status: "confirmed", confirmedAt: now, confirmedBy })
			.where(
				and(
					eq(schema.feePaymentOrders.id, orderId),
					eq(schema.feePaymentOrders.institutionId, institutionId),
				),
			)
			.returning();
		const [payment] = await tx
			.insert(schema.feePayments)
			.values({
				institutionId,
				feeAssignmentId: order.feeAssignmentId,
				paymentOrderId: orderId,
				amount: order.amount,
				currency: order.currency,
				paymentDate: input.paymentDate,
				paymentMethod: input.paymentMethod as never,
				reference: input.reference ?? null,
				notes: input.notes ?? null,
				recordedBy: confirmedBy,
			})
			.returning();
		return { updatedOrder, payment };
	});

	await recalculateAssignmentStatus(order.feeAssignmentId, institutionId);
	return { order: updatedOrder, payment };
}

export async function cancelOrder(orderId: string, institutionId: string) {
	const order = await repo.findOrderById(orderId, institutionId);
	if (!order) throw notFound("Payment order not found");
	if (order.status !== "pending")
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot cancel an order with status '${order.status}'`,
		});

	return repo.updateOrder(orderId, institutionId, { status: "cancelled" });
}

export async function getOrder(orderId: string, institutionId: string) {
	const order = await repo.findOrderById(orderId, institutionId);
	if (!order) throw notFound("Payment order not found");
	return order;
}

export async function listOrders(
	institutionId: string,
	opts: {
		feeAssignmentId?: string;
		status?: string;
		limit?: number;
		offset?: number;
	},
) {
	return repo.listOrders(
		institutionId,
		opts as Parameters<typeof repo.listOrders>[1],
	);
}

// ── Gating ────────────────────────────────────────────────────────────

export async function listGatingRules(institutionId: string) {
	const rules = await repo.listGatingRules(institutionId);
	// Ensure all gates are represented (default disabled)
	const gateSet = new Set(rules.map((r) => r.gate));
	const missing = (
		[
			"exam_registration",
			"transcript",
			"diploma",
			"reenrollment",
			"document_generation",
		] as FeeGate[]
	).filter((g) => !gateSet.has(g));

	return [
		...rules,
		...missing.map((gate) => ({
			id: null as unknown as string,
			institutionId,
			gate,
			isEnabled: false,
			updatedAt: new Date(),
			updatedBy: null,
		})),
	];
}

export async function toggleGate(
	institutionId: string,
	updatedBy: string | null,
	gate: FeeGate,
	isEnabled: boolean,
) {
	return repo.upsertGatingRule(institutionId, gate, isEnabled, updatedBy);
}

/** Check whether a student is cleared for a given gate in a given year. */
export async function checkGate(
	institutionId: string,
	studentId: string,
	gate: FeeGate,
	academicYearId: string,
): Promise<{ cleared: boolean; reason?: string }> {
	const rule = await repo.findGatingRule(institutionId, gate);
	if (!rule || !rule.isEnabled) return { cleared: true };

	const assignment = await repo.findAssignmentForStudent(
		studentId,
		academicYearId,
		institutionId,
	);
	if (!assignment)
		return {
			cleared: false,
			reason: "No fee assignment found for this academic year",
		};
	if (assignment.status === "paid" || assignment.status === "exempt")
		return { cleared: true };
	return {
		cleared: false,
		reason: `Fee clearance required. Current status: ${assignment.status}`,
	};
}

// ── Student-facing ────────────────────────────────────────────────────

export async function getMyFeeStatus(
	studentId: string,
	institutionId: string,
	academicYearId?: string,
) {
	if (academicYearId) {
		return repo.findAssignmentForStudent(
			studentId,
			academicYearId,
			institutionId,
		);
	}

	// Return all assignments for the student, ordered by year desc
	const { items } = await repo.listAssignments(institutionId, {
		limit: 10,
		offset: 0,
	});
	return items.filter((a) => a.studentId === studentId);
}
