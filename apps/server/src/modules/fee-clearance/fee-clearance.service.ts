import { TRPCError } from "@trpc/server";
import type {
	FeeAssignmentBatchMode,
	FeeAssignmentStatus,
	FeeGate,
} from "@/db/schema/app-schema";
import { conflict, notFound } from "../_shared/errors";
import * as repo from "./fee-clearance.repo";

// ── Helpers ───────────────────────────────────────────────────────────

function generateOrderReference(): string {
	const now = new Date();
	const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
	const rand = Math.random().toString(36).toUpperCase().slice(2, 8);
	return `ORD-${yymm}-${rand}`;
}

function generateReceiptNumber(): string {
	const now = new Date();
	const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
	const rand = Math.random().toString(36).toUpperCase().slice(2, 8);
	return `RCT-${yymm}-${rand}`;
}

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
	if (structure.academicYearId !== input.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Fee structure does not belong to the selected academic year. Select a structure for the same year as the assignment.",
		});

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

export async function previewBulkAssign(
	institutionId: string,
	input: { classId: string; feeStructureId: string },
) {
	const klass = await repo.findClassById(input.classId, institutionId);
	if (!klass) throw notFound("Class not found");

	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");
	if (structure.academicYearId !== klass.academicYear)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Fee structure academic year does not match the class academic year.",
		});

	const students = await repo.findStudentsByClass(input.classId);

	const toAssign: Array<{
		studentId: string;
		firstName: string;
		lastName: string;
		registrationNumber: string;
		amount: string;
		currency: string;
	}> = [];
	const alreadyAssigned: string[] = [];

	for (const student of students) {
		const existing = await repo.findAssignmentForStudent(
			student.id,
			structure.academicYearId,
			institutionId,
		);
		if (existing) {
			alreadyAssigned.push(student.id);
		} else {
			toAssign.push({
				studentId: student.id,
				firstName: student.profile?.firstName ?? "",
				lastName: student.profile?.lastName ?? "",
				registrationNumber: student.registrationNumber,
				amount: structure.totalAmount,
				currency: structure.currency,
			});
		}
	}

	return {
		toAssign,
		alreadyAssignedCount: alreadyAssigned.length,
		totalStudents: students.length,
		feeStructureName: structure.name,
		className: klass.name,
	};
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
	if (structure.academicYearId !== klass.academicYear)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Fee structure academic year does not match the class academic year. Choose a structure for the same year.",
		});

	const students = await repo.findStudentsByClass(input.classId);
	if (students.length === 0) {
		await repo.createBatchRecord({
			institutionId,
			mode: "class",
			scopeId: input.classId,
			feeStructureId: structure.id,
			feeStructureName: structure.name,
			assignedCount: 0,
			skippedCount: 0,
			createdBy: createdBy ?? null,
		});
		return { assigned: 0, skipped: 0 };
	}

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

	await repo.createBatchRecord({
		institutionId,
		mode: "class",
		scopeId: input.classId,
		feeStructureId: structure.id,
		feeStructureName: structure.name,
		assignedCount: assigned,
		skippedCount: skipped,
		createdBy: createdBy ?? null,
	});

	return { assigned, skipped };
}

// ── Shared bulk-assign helper ─────────────────────────────────────────

type StudentRow = {
	id: string;
	registrationNumber: string;
	profile: { firstName: string; lastName: string } | null;
};

async function buildPreviewForStudents(
	students: StudentRow[],
	structure: {
		id: string;
		totalAmount: string;
		currency: string;
		academicYearId: string;
		name: string;
	},
	institutionId: string,
	scopeLabel: string,
) {
	const toAssign: Array<{
		studentId: string;
		firstName: string;
		lastName: string;
		registrationNumber: string;
		amount: string;
		currency: string;
	}> = [];
	const alreadyAssigned: string[] = [];

	for (const student of students) {
		const existing = await repo.findAssignmentForStudent(
			student.id,
			structure.academicYearId,
			institutionId,
		);
		if (existing) {
			alreadyAssigned.push(student.id);
		} else {
			toAssign.push({
				studentId: student.id,
				firstName: student.profile?.firstName ?? "",
				lastName: student.profile?.lastName ?? "",
				registrationNumber: student.registrationNumber,
				amount: structure.totalAmount,
				currency: structure.currency,
			});
		}
	}

	return {
		toAssign,
		alreadyAssignedCount: alreadyAssigned.length,
		totalStudents: students.length,
		feeStructureName: structure.name,
		scopeLabel,
	};
}

async function executeBulkAssign(
	students: StudentRow[],
	structure: {
		id: string;
		totalAmount: string;
		currency: string;
		academicYearId: string;
		name: string;
	},
	institutionId: string,
	createdBy: string | null,
	mode: FeeAssignmentBatchMode,
	scopeId: string | null,
	skipExisting: boolean,
) {
	let assigned = 0;
	let skipped = 0;

	for (const student of students) {
		const existing = await repo.findAssignmentForStudent(
			student.id,
			structure.academicYearId,
			institutionId,
		);
		if (existing) {
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

	await repo.createBatchRecord({
		institutionId,
		mode,
		scopeId,
		feeStructureId: structure.id,
		feeStructureName: structure.name,
		assignedCount: assigned,
		skippedCount: skipped,
		createdBy: createdBy ?? null,
	});

	return { assigned, skipped };
}

// ── Program mode ──────────────────────────────────────────────────────

export async function previewBulkAssignProgram(
	institutionId: string,
	input: { programId: string; academicYearId: string; feeStructureId: string },
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");
	if (structure.academicYearId !== input.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Fee structure academic year does not match the selected year.",
		});

	const students = await repo.findStudentsByProgram(
		input.programId,
		input.academicYearId,
		institutionId,
	);
	return buildPreviewForStudents(
		students,
		structure,
		institutionId,
		`Program ${input.programId}`,
	);
}

export async function bulkAssignProgram(
	institutionId: string,
	createdBy: string | null,
	input: {
		programId: string;
		academicYearId: string;
		feeStructureId: string;
		skipExisting: boolean;
	},
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");
	if (structure.academicYearId !== input.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Fee structure academic year does not match the selected year.",
		});

	const students = await repo.findStudentsByProgram(
		input.programId,
		input.academicYearId,
		institutionId,
	);

	return executeBulkAssign(
		students,
		structure,
		institutionId,
		createdBy,
		"program",
		input.programId,
		input.skipExisting,
	);
}

// ── Academic year mode ────────────────────────────────────────────────

export async function previewBulkAssignYear(
	institutionId: string,
	input: { academicYearId: string; feeStructureId: string },
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");
	if (structure.academicYearId !== input.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Fee structure academic year does not match the selected year.",
		});

	const students = await repo.findStudentsByYear(
		input.academicYearId,
		institutionId,
	);
	return buildPreviewForStudents(
		students,
		structure,
		institutionId,
		`Year ${input.academicYearId}`,
	);
}

export async function bulkAssignYear(
	institutionId: string,
	createdBy: string | null,
	input: {
		academicYearId: string;
		feeStructureId: string;
		skipExisting: boolean;
	},
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");
	if (structure.academicYearId !== input.academicYearId)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Fee structure academic year does not match the selected year.",
		});

	const students = await repo.findStudentsByYear(
		input.academicYearId,
		institutionId,
	);

	return executeBulkAssign(
		students,
		structure,
		institutionId,
		createdBy,
		"year",
		input.academicYearId,
		input.skipExisting,
	);
}

// ── Selected students mode ────────────────────────────────────────────

export async function previewBulkAssignStudents(
	institutionId: string,
	input: { studentIds: string[]; feeStructureId: string },
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const students = await repo.findStudentsByIds(
		input.studentIds,
		institutionId,
	);
	return buildPreviewForStudents(
		students,
		structure,
		institutionId,
		`${input.studentIds.length} student(s)`,
	);
}

export async function bulkAssignStudents(
	institutionId: string,
	createdBy: string | null,
	input: {
		studentIds: string[];
		feeStructureId: string;
		skipExisting: boolean;
	},
) {
	const structure = await repo.findFeeStructureById(
		input.feeStructureId,
		institutionId,
	);
	if (!structure) throw notFound("Fee structure not found");

	const students = await repo.findStudentsByIds(
		input.studentIds,
		institutionId,
	);

	return executeBulkAssign(
		students,
		structure,
		institutionId,
		createdBy,
		"students",
		null,
		input.skipExisting,
	);
}

// ── Batch runs listing ────────────────────────────────────────────────

export async function listBatchRuns(
	institutionId: string,
	opts: { limit?: number; offset?: number },
) {
	return repo.listBatchRecords(institutionId, opts);
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
	// Optimistic pre-checks outside the transaction (fast-path for common errors).
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

	// Balance check and insert are atomic under a row-level lock so concurrent
	// payments on the same assignment cannot both pass the remaining-balance guard.
	const { db } = await import("@/db");
	const { eq, sql } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const payment = await db.transaction(async (tx) => {
		// Lock the assignment row for the duration of this transaction.
		const [locked] = await tx
			.select()
			.from(schema.studentFeeAssignments)
			.where(eq(schema.studentFeeAssignments.id, input.feeAssignmentId))
			.for("update");
		if (!locked) throw notFound("Fee assignment not found");

		// Re-sum inside the transaction against the locked row.
		const [sumRow] = await tx
			.select({
				total: sql<string>`coalesce(sum(${schema.feePayments.amount}), 0)`,
			})
			.from(schema.feePayments)
			.where(eq(schema.feePayments.feeAssignmentId, input.feeAssignmentId));
		const paid = Number(sumRow?.total ?? 0);
		const effective = Number(locked.effectiveAmount);

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

		const [row] = await tx
			.insert(schema.feePayments)
			.values({
				institutionId,
				feeAssignmentId: input.feeAssignmentId,
				installmentId: input.installmentId ?? null,
				amount: String(input.amount),
				currency: input.currency,
				paymentDate: input.paymentDate,
				paymentMethod: input.paymentMethod as never,
				reference: input.reference ?? generateReceiptNumber(),
				notes: input.notes ?? null,
				recordedBy,
			})
			.returning();
		return row;
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

	const reference = input.reference ?? generateOrderReference();

	return repo.createOrder({
		institutionId,
		feeAssignmentId: input.feeAssignmentId,
		amount: String(input.amount),
		currency: input.currency,
		installmentIds: input.installmentIds,
		reference,
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

	// All critical checks (balance + status transition + payment insert) run
	// inside one transaction. The assignment row is locked first (FOR UPDATE)
	// so concurrent confirmations of different orders for the same assignment
	// are serialized and the balance invariant is enforced atomically.
	const { db } = await import("@/db");
	const { eq, and, sql } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const now = new Date();
	const { updatedOrder, payment } = await db.transaction(async (tx) => {
		// Acquire row-level lock on the assignment before any balance arithmetic.
		const [lockedAssignment] = await tx
			.select()
			.from(schema.studentFeeAssignments)
			.where(eq(schema.studentFeeAssignments.id, order.feeAssignmentId))
			.for("update");
		if (!lockedAssignment) throw notFound("Fee assignment not found");

		// Re-sum payments under the lock — authoritative balance check.
		const [sumRow] = await tx
			.select({
				total: sql<string>`coalesce(sum(${schema.feePayments.amount}), 0)`,
			})
			.from(schema.feePayments)
			.where(eq(schema.feePayments.feeAssignmentId, order.feeAssignmentId));
		const alreadyPaid = Number(sumRow?.total ?? 0);
		const remaining = Number(lockedAssignment.effectiveAmount) - alreadyPaid;
		if (Number(order.amount) > remaining)
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Order amount exceeds remaining balance (${remaining}).`,
			});

		// Transition order status — AND status='pending' guards same-order races.
		const [updatedOrder] = await tx
			.update(schema.feePaymentOrders)
			.set({ status: "confirmed", confirmedAt: now, confirmedBy })
			.where(
				and(
					eq(schema.feePaymentOrders.id, orderId),
					eq(schema.feePaymentOrders.institutionId, institutionId),
					eq(schema.feePaymentOrders.status, "pending"),
				),
			)
			.returning();
		if (!updatedOrder)
			throw new TRPCError({
				code: "CONFLICT",
				message:
					"Order was already confirmed or cancelled by a concurrent request",
			});

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
				reference: input.reference ?? generateReceiptNumber(),
				notes: input.notes ?? null,
				recordedBy: confirmedBy,
			})
			.returning();
		return { updatedOrder, payment };
	});

	await recalculateAssignmentStatus(order.feeAssignmentId, institutionId);

	// Notify the student in-app (fire-and-forget)
	const assignment = await repo.findAssignmentById(
		order.feeAssignmentId,
		institutionId,
	);
	if (assignment?.studentId) {
		const { queueInApp } = await import(
			"../notifications/notifications.service"
		);
		queueInApp(assignment.studentId, "fee.payment_confirmed", {
			amount: Number(order.amount),
			currency: order.currency,
			reference: payment.reference,
		}).catch(() => {});
	}

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

// ── Document generation ───────────────────────────────────────────────

async function fetchDocumentContext(institutionId: string) {
	const { db } = await import("@/db");
	const { eq } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");
	const inst = await db.query.institutions.findFirst({
		where: eq(schema.institutions.id, institutionId),
	});
	return inst ?? null;
}

function fmtDate(d: Date | string | null | undefined): string {
	if (!d) return "";
	return new Date(d).toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export async function generateOrderDocument(
	orderId: string,
	institutionId: string,
): Promise<{ html: string; pdf: string }> {
	const order = await repo.findOrderById(orderId, institutionId);
	if (!order) throw notFound("Payment order not found");

	const assignment = await repo.findAssignmentById(
		order.feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");

	const institution = await fetchDocumentContext(institutionId);
	const profile = assignment.student?.profile;

	const context = {
		institution: {
			name: institution?.nameFr ?? institution?.nameEn ?? "—",
			shortName: institution?.shortName ?? null,
		},
		student: {
			fullName: profile
				? `${profile.lastName ?? ""} ${profile.firstName ?? ""}`.trim()
				: "—",
			registrationNumber: assignment.student?.registrationNumber ?? "—",
		},
		academicYear: { name: assignment.academicYear?.name ?? "—" },
		feeStructure: { name: assignment.feeStructure?.name ?? "—" },
		order: {
			reference: order.reference ?? "—",
			amount: Number(order.amount).toLocaleString("fr-FR"),
			currency: order.currency,
			createdAt: fmtDate(order.createdAt),
			expiresAt: order.expiresAt ? fmtDate(order.expiresAt) : null,
			notes: order.notes ?? null,
		},
		assignment: { status: assignment.status },
	};

	const Handlebars = (await import("handlebars")).default;
	const { PAYMENT_ORDER_TEMPLATE } = await import(
		"../exports/financial-templates"
	);
	const html = Handlebars.compile(PAYMENT_ORDER_TEMPLATE)(context);

	const { renderPdf } = await import(
		"../academic-documents/academic-documents.service"
	);
	const pdfBuffer = await renderPdf(html, {});
	return { html, pdf: pdfBuffer.toString("base64") };
}

export async function generateReceiptDocument(
	paymentId: string,
	institutionId: string,
): Promise<{ html: string; pdf: string }> {
	const { db } = await import("@/db");
	const { eq, and } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	const payment = await db.query.feePayments.findFirst({
		where: and(
			eq(schema.feePayments.id, paymentId),
			eq(schema.feePayments.institutionId, institutionId),
		),
		with: { recordedByRef: true },
	});
	if (!payment) throw notFound("Payment not found");

	const assignment = await repo.findAssignmentById(
		payment.feeAssignmentId,
		institutionId,
	);
	if (!assignment) throw notFound("Fee assignment not found");

	const institution = await fetchDocumentContext(institutionId);
	const profile = assignment.student?.profile;

	const context = {
		institution: {
			name: institution?.nameFr ?? institution?.nameEn ?? "—",
			shortName: institution?.shortName ?? null,
		},
		student: {
			fullName: profile
				? `${profile.lastName ?? ""} ${profile.firstName ?? ""}`.trim()
				: "—",
			registrationNumber: assignment.student?.registrationNumber ?? "—",
		},
		academicYear: { name: assignment.academicYear?.name ?? "—" },
		feeStructure: { name: assignment.feeStructure?.name ?? "—" },
		payment: {
			reference: payment.reference ?? "—",
			paymentDate: fmtDate(payment.paymentDate),
			paymentMethod: payment.paymentMethod,
			amount: Number(payment.amount).toLocaleString("fr-FR"),
			currency: payment.currency,
			createdAt: fmtDate(payment.createdAt),
			recordedByName: payment.recordedByRef
				? `${payment.recordedByRef.firstName ?? ""} ${payment.recordedByRef.lastName ?? ""}`.trim()
				: "—",
		},
	};

	const Handlebars = (await import("handlebars")).default;
	const { PAYMENT_RECEIPT_TEMPLATE } = await import(
		"../exports/financial-templates"
	);
	const html = Handlebars.compile(PAYMENT_RECEIPT_TEMPLATE)(context);

	const { renderPdf } = await import(
		"../academic-documents/academic-documents.service"
	);
	const pdfBuffer = await renderPdf(html, {});
	return { html, pdf: pdfBuffer.toString("base64") };
}

export async function getStudentFinancialHistory(
	studentId: string,
	institutionId: string,
) {
	const { db } = await import("@/db");
	const { eq, and, desc } = await import("drizzle-orm");
	const schema = await import("@/db/schema/app-schema");

	// All assignments for this student in this institution
	const assignments = await db.query.studentFeeAssignments.findMany({
		where: and(
			eq(schema.studentFeeAssignments.studentId, studentId),
			eq(schema.studentFeeAssignments.institutionId, institutionId),
		),
		with: {
			feeStructure: true,
			academicYear: true,
			payments: { orderBy: desc(schema.feePayments.createdAt) },
			orders: { orderBy: desc(schema.feePaymentOrders.createdAt) },
		},
		orderBy: desc(schema.studentFeeAssignments.createdAt),
	});

	return assignments.map((a) => {
		const paidAmount = a.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		return {
			id: a.id,
			status: a.status,
			effectiveAmount: Number(a.effectiveAmount),
			paidAmount,
			balance: Number(a.effectiveAmount) - paidAmount,
			currency: a.currency,
			clearedAt: a.clearedAt,
			feeStructure: a.feeStructure
				? { id: a.feeStructure.id, name: a.feeStructure.name }
				: null,
			academicYear: a.academicYear
				? { id: a.academicYear.id, name: a.academicYear.name }
				: null,
			payments: a.payments,
			orders: a.orders,
		};
	});
}

// ── Bank Import ───────────────────────────────────────────────────────

type BankRow = { reference: string; amount: number; date: string };
export type BankImportStatus =
	| "matched"
	| "duplicate"
	| "unknown_ref"
	| "amount_mismatch";

export type BankImportLineResult = {
	reference: string;
	amount: number;
	date: string;
	status: BankImportStatus;
	orderId?: string;
	orderAmount?: number;
	studentName?: string;
};

export async function previewBankImport(
	institutionId: string,
	rows: BankRow[],
): Promise<{
	results: BankImportLineResult[];
	summary: {
		matched: number;
		duplicate: number;
		unknownRef: number;
		amountMismatch: number;
	};
}> {
	const refs = [...new Set(rows.map((r) => r.reference))];
	const orders = await repo.findOrdersByReferences(refs, institutionId);
	const ordersByRef = new Map(
		orders.filter((o) => o.reference).map((o) => [o.reference as string, o]),
	);

	const results: BankImportLineResult[] = [];
	const consumedRefs = new Set<string>();

	for (const row of rows) {
		const order = ordersByRef.get(row.reference);

		if (!order) {
			results.push({ ...row, status: "unknown_ref" });
			continue;
		}

		if (order.status === "confirmed" || consumedRefs.has(row.reference)) {
			results.push({
				...row,
				status: "duplicate",
				orderId: order.id,
				orderAmount: Number(order.amount),
			});
			continue;
		}

		const amountDiff = Math.abs(Number(order.amount) - row.amount);
		if (amountDiff > 0.5) {
			const profile = order.feeAssignment?.student?.profile;
			results.push({
				...row,
				status: "amount_mismatch",
				orderId: order.id,
				orderAmount: Number(order.amount),
				studentName: profile
					? `${profile.firstName} ${profile.lastName}`
					: undefined,
			});
			continue;
		}

		consumedRefs.add(row.reference);
		const profile = order.feeAssignment?.student?.profile;
		results.push({
			...row,
			status: "matched",
			orderId: order.id,
			orderAmount: Number(order.amount),
			studentName: profile
				? `${profile.firstName} ${profile.lastName}`
				: undefined,
		});
	}

	return {
		results,
		summary: {
			matched: results.filter((r) => r.status === "matched").length,
			duplicate: results.filter((r) => r.status === "duplicate").length,
			unknownRef: results.filter((r) => r.status === "unknown_ref").length,
			amountMismatch: results.filter((r) => r.status === "amount_mismatch")
				.length,
		},
	};
}

export async function applyBankImport(
	institutionId: string,
	rows: BankRow[],
	confirmedBy: string,
	opts: { paymentMethod: string; notes?: string; forceMatchRefs?: string[] },
): Promise<{
	applied: number;
	skipped: number;
	errors: { reference: string; reason: string }[];
}> {
	const { results } = await previewBankImport(institutionId, rows);
	const forceSet = new Set(opts.forceMatchRefs ?? []);

	const toApply = results.filter(
		(r) =>
			r.status === "matched" ||
			(r.status === "amount_mismatch" &&
				r.orderId &&
				forceSet.has(r.reference)),
	);

	let applied = 0;
	const errors: { reference: string; reason: string }[] = [];

	for (const line of toApply) {
		if (!line.orderId) continue;
		try {
			await confirmOrder(line.orderId, institutionId, confirmedBy, {
				paymentDate: line.date,
				paymentMethod: opts.paymentMethod,
				reference: line.reference,
				notes: opts.notes,
			});
			applied++;
		} catch (e) {
			errors.push({
				reference: line.reference,
				reason: e instanceof Error ? e.message : String(e),
			});
		}
	}

	return {
		applied,
		skipped: results.length - toApply.length,
		errors,
	};
}
