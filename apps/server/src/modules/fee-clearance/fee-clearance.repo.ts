import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import type {
	FeeAssignmentStatus,
	FeeGate,
	FeePaymentOrderStatus,
	NewFeePayment,
	NewFeePaymentOrder,
	NewFeeStructure,
	NewFeeStructureInstallment,
	NewStudentFeeAssignment,
} from "@/db/schema/app-schema";
import * as schema from "@/db/schema/app-schema";

// ── Fee Structures ────────────────────────────────────────────────────

export async function createFeeStructure(data: NewFeeStructure) {
	const [row] = await db.insert(schema.feeStructures).values(data).returning();
	return row;
}

export async function findFeeStructureById(id: string, institutionId: string) {
	return db.query.feeStructures.findFirst({
		where: and(
			eq(schema.feeStructures.id, id),
			eq(schema.feeStructures.institutionId, institutionId),
		),
		with: {
			installments: { orderBy: schema.feeStructureInstallments.orderIndex },
			academicYear: true,
			program: true,
			cycleLevel: true,
		},
	});
}

export async function listFeeStructures(
	institutionId: string,
	opts: {
		academicYearId?: string;
		programId?: string;
		isActive?: boolean;
	} = {},
) {
	const conditions = [eq(schema.feeStructures.institutionId, institutionId)];
	if (opts.academicYearId)
		conditions.push(
			eq(schema.feeStructures.academicYearId, opts.academicYearId),
		);
	if (opts.programId)
		conditions.push(eq(schema.feeStructures.programId, opts.programId));
	if (opts.isActive !== undefined)
		conditions.push(eq(schema.feeStructures.isActive, opts.isActive));

	return db.query.feeStructures.findMany({
		where: and(...conditions),
		orderBy: desc(schema.feeStructures.createdAt),
		with: {
			installments: { orderBy: schema.feeStructureInstallments.orderIndex },
			academicYear: true,
			program: true,
			cycleLevel: true,
		},
	});
}

export async function updateFeeStructure(
	id: string,
	institutionId: string,
	data: Partial<schema.FeeStructure>,
) {
	const [row] = await db
		.update(schema.feeStructures)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.feeStructures.id, id),
				eq(schema.feeStructures.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

export async function deleteFeeStructure(id: string, institutionId: string) {
	const [row] = await db
		.delete(schema.feeStructures)
		.where(
			and(
				eq(schema.feeStructures.id, id),
				eq(schema.feeStructures.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

// ── Installments ──────────────────────────────────────────────────────

export async function addInstallment(data: NewFeeStructureInstallment) {
	const [row] = await db
		.insert(schema.feeStructureInstallments)
		.values(data)
		.returning();
	return row;
}

export async function updateInstallment(
	id: string,
	data: Partial<schema.FeeStructureInstallment>,
) {
	const [row] = await db
		.update(schema.feeStructureInstallments)
		.set(data)
		.where(eq(schema.feeStructureInstallments.id, id))
		.returning();
	return row;
}

export async function deleteInstallment(id: string) {
	const [row] = await db
		.delete(schema.feeStructureInstallments)
		.where(eq(schema.feeStructureInstallments.id, id))
		.returning();
	return row;
}

export async function findInstallmentById(id: string) {
	return db.query.feeStructureInstallments.findFirst({
		where: eq(schema.feeStructureInstallments.id, id),
		with: { feeStructure: true },
	});
}

// ── Assignments ───────────────────────────────────────────────────────

export async function createAssignment(data: NewStudentFeeAssignment) {
	const [row] = await db
		.insert(schema.studentFeeAssignments)
		.values(data)
		.returning();
	return row;
}

export async function findAssignmentById(id: string, institutionId: string) {
	return db.query.studentFeeAssignments.findFirst({
		where: and(
			eq(schema.studentFeeAssignments.id, id),
			eq(schema.studentFeeAssignments.institutionId, institutionId),
		),
		with: {
			student: { with: { profile: true } },
			feeStructure: { with: { installments: true } },
			academicYear: true,
			payments: { orderBy: desc(schema.feePayments.createdAt) },
		},
	});
}

export async function findAssignmentForStudent(
	studentId: string,
	academicYearId: string,
	institutionId: string,
) {
	return db.query.studentFeeAssignments.findFirst({
		where: and(
			eq(schema.studentFeeAssignments.studentId, studentId),
			eq(schema.studentFeeAssignments.academicYearId, academicYearId),
			eq(schema.studentFeeAssignments.institutionId, institutionId),
		),
		with: {
			feeStructure: true,
			payments: { orderBy: desc(schema.feePayments.createdAt) },
		},
	});
}

export async function listAssignments(
	institutionId: string,
	opts: {
		academicYearId?: string;
		status?: FeeAssignmentStatus[];
		classId?: string;
		programId?: string;
		search?: string;
		limit?: number;
		offset?: number;
	} = {},
) {
	const conditions = [
		eq(schema.studentFeeAssignments.institutionId, institutionId),
	];

	if (opts.academicYearId)
		conditions.push(
			eq(schema.studentFeeAssignments.academicYearId, opts.academicYearId),
		);
	if (opts.status?.length)
		conditions.push(
			inArray(
				schema.studentFeeAssignments.status,
				opts.status as FeeAssignmentStatus[],
			),
		);

	// class/program filter via student → class join
	if (opts.classId) {
		const studentIds = await db
			.select({ id: schema.students.id })
			.from(schema.students)
			.where(eq(schema.students.class, opts.classId));
		if (studentIds.length === 0) return { items: [], total: 0 };
		conditions.push(
			inArray(
				schema.studentFeeAssignments.studentId,
				studentIds.map((s) => s.id),
			),
		);
	}

	if (opts.search) {
		const like = `%${opts.search}%`;
		const matchingUsers = await db
			.select({ id: schema.domainUsers.id })
			.from(schema.domainUsers)
			.where(
				or(
					ilike(schema.domainUsers.firstName, like),
					ilike(schema.domainUsers.lastName, like),
					ilike(schema.domainUsers.primaryEmail, like),
				),
			);
		const matchingStudents = await db
			.select({ id: schema.students.id })
			.from(schema.students)
			.where(
				matchingUsers.length > 0
					? inArray(
							schema.students.domainUserId,
							matchingUsers.map((u) => u.id),
						)
					: sql`false`,
			);
		if (matchingStudents.length === 0) return { items: [], total: 0 };
		conditions.push(
			inArray(
				schema.studentFeeAssignments.studentId,
				matchingStudents.map((s) => s.id),
			),
		);
	}

	const [countRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.studentFeeAssignments)
		.where(and(...conditions));

	const items = await db.query.studentFeeAssignments.findMany({
		where: and(...conditions),
		orderBy: desc(schema.studentFeeAssignments.createdAt),
		limit: opts.limit ?? 50,
		offset: opts.offset ?? 0,
		with: {
			student: { with: { profile: true } },
			feeStructure: true,
			academicYear: true,
		},
	});

	return { items, total: countRow?.count ?? 0 };
}

export async function updateAssignment(
	id: string,
	institutionId: string,
	data: Partial<schema.StudentFeeAssignment>,
) {
	const [row] = await db
		.update(schema.studentFeeAssignments)
		.set({ ...data, updatedAt: new Date() })
		.where(
			and(
				eq(schema.studentFeeAssignments.id, id),
				eq(schema.studentFeeAssignments.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

/** Sum all payments for an assignment. */
export async function sumPayments(feeAssignmentId: string): Promise<number> {
	const [row] = await db
		.select({
			total: sql<string>`coalesce(sum(${schema.feePayments.amount}), 0)`,
		})
		.from(schema.feePayments)
		.where(eq(schema.feePayments.feeAssignmentId, feeAssignmentId));
	return Number(row?.total ?? 0);
}

// ── Payments ──────────────────────────────────────────────────────────

export async function recordPayment(data: NewFeePayment) {
	const [row] = await db.insert(schema.feePayments).values(data).returning();
	return row;
}

export async function findPaymentById(id: string) {
	return db.query.feePayments.findFirst({
		where: eq(schema.feePayments.id, id),
		with: { feeAssignment: true },
	});
}

export async function deletePayment(id: string) {
	const [row] = await db
		.delete(schema.feePayments)
		.where(eq(schema.feePayments.id, id))
		.returning();
	return row;
}

export async function listPayments(feeAssignmentId: string) {
	return db.query.feePayments.findMany({
		where: eq(schema.feePayments.feeAssignmentId, feeAssignmentId),
		orderBy: desc(schema.feePayments.paymentDate),
		with: { recordedByRef: true, installment: true },
	});
}

// ── Payment Orders ────────────────────────────────────────────────────

export async function createOrder(data: NewFeePaymentOrder) {
	const [row] = await db
		.insert(schema.feePaymentOrders)
		.values(data)
		.returning();
	return row;
}

export async function findOrderById(id: string, institutionId: string) {
	return db.query.feePaymentOrders.findFirst({
		where: and(
			eq(schema.feePaymentOrders.id, id),
			eq(schema.feePaymentOrders.institutionId, institutionId),
		),
		with: {
			feeAssignment: true,
			payments: { orderBy: desc(schema.feePayments.createdAt) },
		},
	});
}

export async function findOrdersByReferences(
	refs: string[],
	institutionId: string,
) {
	if (refs.length === 0) return [];
	return db.query.feePaymentOrders.findMany({
		where: and(
			eq(schema.feePaymentOrders.institutionId, institutionId),
			inArray(schema.feePaymentOrders.reference, refs),
		),
		with: {
			feeAssignment: {
				with: {
					student: {
						with: { profile: { columns: { firstName: true, lastName: true } } },
					},
				},
			},
		},
	});
}

export async function listOrders(
	institutionId: string,
	opts: {
		feeAssignmentId?: string;
		status?: FeePaymentOrderStatus;
		limit?: number;
		offset?: number;
	} = {},
) {
	const conditions = [eq(schema.feePaymentOrders.institutionId, institutionId)];
	if (opts.feeAssignmentId)
		conditions.push(
			eq(schema.feePaymentOrders.feeAssignmentId, opts.feeAssignmentId),
		);
	if (opts.status)
		conditions.push(eq(schema.feePaymentOrders.status, opts.status));

	const [countRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(schema.feePaymentOrders)
		.where(and(...conditions));

	const items = await db.query.feePaymentOrders.findMany({
		where: and(...conditions),
		orderBy: desc(schema.feePaymentOrders.createdAt),
		limit: opts.limit ?? 50,
		offset: opts.offset ?? 0,
		with: { feeAssignment: true },
	});

	return { items, total: countRow?.count ?? 0 };
}

export async function updateOrder(
	id: string,
	institutionId: string,
	data: Partial<schema.FeePaymentOrder>,
) {
	const [row] = await db
		.update(schema.feePaymentOrders)
		.set(data)
		.where(
			and(
				eq(schema.feePaymentOrders.id, id),
				eq(schema.feePaymentOrders.institutionId, institutionId),
			),
		)
		.returning();
	return row;
}

// ── Gating ────────────────────────────────────────────────────────────

export async function listGatingRules(institutionId: string) {
	return db.query.feeGatingRules.findMany({
		where: eq(schema.feeGatingRules.institutionId, institutionId),
	});
}

export async function upsertGatingRule(
	institutionId: string,
	gate: FeeGate,
	isEnabled: boolean,
	updatedBy: string | null,
) {
	const [row] = await db
		.insert(schema.feeGatingRules)
		.values({
			institutionId,
			gate,
			isEnabled,
			updatedBy: updatedBy ?? undefined,
		})
		.onConflictDoUpdate({
			target: [schema.feeGatingRules.institutionId, schema.feeGatingRules.gate],
			set: {
				isEnabled,
				updatedAt: new Date(),
				updatedBy: updatedBy ?? undefined,
			},
		})
		.returning();
	return row;
}

export async function findGatingRule(institutionId: string, gate: FeeGate) {
	return db.query.feeGatingRules.findFirst({
		where: and(
			eq(schema.feeGatingRules.institutionId, institutionId),
			eq(schema.feeGatingRules.gate, gate),
		),
	});
}

// ── Students in a class (for bulk assign) ────────────────────────────

export async function findStudentsByClass(classId: string) {
	return db.query.students.findMany({
		where: eq(schema.students.class, classId),
		with: { profile: { columns: { firstName: true, lastName: true } } },
	});
}

export async function findStudentsByProgram(
	programId: string,
	academicYearId: string,
) {
	// Students enrolled in any class belonging to the program + year
	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.program, programId),
			eq(schema.classes.academicYear, academicYearId),
		),
		columns: { id: true },
	});
	if (classes.length === 0) return [];
	const classIds = classes.map((c) => c.id);
	return db.query.students.findMany({
		where: inArray(schema.students.class, classIds),
		with: { profile: { columns: { firstName: true, lastName: true } } },
	});
}

export async function findStudentsByYear(
	academicYearId: string,
	institutionId: string,
) {
	const classes = await db.query.classes.findMany({
		where: and(
			eq(schema.classes.academicYear, academicYearId),
			eq(schema.classes.institutionId, institutionId),
		),
		columns: { id: true },
	});
	if (classes.length === 0) return [];
	const classIds = classes.map((c) => c.id);
	return db.query.students.findMany({
		where: inArray(schema.students.class, classIds),
		with: { profile: { columns: { firstName: true, lastName: true } } },
	});
}

export async function findStudentsByIds(studentIds: string[]) {
	if (studentIds.length === 0) return [];
	return db.query.students.findMany({
		where: inArray(schema.students.id, studentIds),
		with: { profile: { columns: { firstName: true, lastName: true } } },
	});
}

export async function createBatchRecord(
	data: import("@/db/schema/app-schema").NewFeeAssignmentBatch,
) {
	const [row] = await db
		.insert(schema.feeAssignmentBatches)
		.values(data)
		.returning();
	return row;
}

export async function listBatchRecords(
	institutionId: string,
	opts: { limit?: number; offset?: number } = {},
) {
	const items = await db.query.feeAssignmentBatches.findMany({
		where: eq(schema.feeAssignmentBatches.institutionId, institutionId),
		orderBy: (t, { desc }) => desc(t.createdAt),
		limit: opts.limit ?? 50,
		offset: opts.offset ?? 0,
	});
	return items;
}

export async function findClassById(classId: string, institutionId: string) {
	return db.query.classes.findFirst({
		where: and(
			eq(schema.classes.id, classId),
			eq(schema.classes.institutionId, institutionId),
		),
	});
}
