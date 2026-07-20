import { beforeEach, describe, expect, it } from "bun:test";
import type { Context } from "@/lib/context";
import { appRouter } from "@/routers";
import {
	createAcademicYear,
	createClass,
	createDomainUser,
	createProgram,
	createStudent,
	makeTestContext,
	setupTestInstitution,
} from "../../../lib/test-utils";
import { assertFeeClearance } from "../fee-clearance.gates";

beforeEach(async () => {
	await setupTestInstitution();
});

const createCaller = (ctx: Context) => appRouter.createCaller(ctx);

async function adminWithRealProfile() {
	const profile = await createDomainUser();
	return makeTestContext({
		role: "administrator",
		profileOverrides: { id: profile.id },
	});
}

describe("feeClearance router", () => {
	it("requires auth", async () => {
		const caller = createCaller(makeTestContext());
		await expect(caller.feeClearance.listStructures({})).rejects.toHaveProperty(
			"code",
			"UNAUTHORIZED",
		);
		await expect(
			caller.feeClearance.listAssignments({}),
		).rejects.toHaveProperty("code", "UNAUTHORIZED");
	});

	// ── Fee Structures ────────────────────────────────────────────────

	describe("structures CRUD", () => {
		it("creates a fee structure", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();

			const result = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Licence 1 — 2024-2025",
				totalAmount: 350000,
				currency: "XAF",
			});

			expect(result.name).toBe("Licence 1 — 2024-2025");
			expect(Number(result.totalAmount)).toBe(350000);
			expect(result.currency).toBe("XAF");
			expect(result.isActive).toBe(true);
		});

		it("lists structures filtered by academic year", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();

			await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Structure A",
				totalAmount: 100000,
				currency: "XAF",
			});

			const list = await caller.feeClearance.listStructures({
				academicYearId: year.id,
			});
			expect(list.length).toBeGreaterThanOrEqual(1);
			expect(list.every((s) => s.academicYearId === year.id)).toBe(true);
		});

		it("updates a fee structure", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();

			const created = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Old name",
				totalAmount: 100000,
				currency: "XAF",
			});

			const updated = await caller.feeClearance.updateStructure({
				id: created.id,
				name: "New name",
				totalAmount: 120000,
			});

			expect(updated?.name).toBe("New name");
			expect(Number(updated?.totalAmount)).toBe(120000);
		});

		it("deletes a fee structure", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();

			const created = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "To delete",
				totalAmount: 50000,
				currency: "XAF",
			});

			await caller.feeClearance.deleteStructure({ id: created.id });

			await expect(
				caller.feeClearance.getStructure({ id: created.id }),
			).rejects.toHaveProperty("code", "NOT_FOUND");
		});
	});

	// ── Installments ──────────────────────────────────────────────────

	describe("installments", () => {
		it("lets a student create an order for one selected installment", async () => {
			const ctx = await adminWithRealProfile();
			const admin = createCaller(ctx);
			const year = await createAcademicYear();
			const klass = await createClass({ academicYear: year.id });
			const student = await createStudent({ class: klass.id });
			const structure = await admin.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Two installments",
				totalAmount: 200000,
				currency: "XAF",
			});
			const first = await admin.feeClearance.addInstallment({
				feeStructureId: structure.id,
				label: "First",
				amount: 80000,
				orderIndex: 0,
			});
			await admin.feeClearance.addInstallment({
				feeStructureId: structure.id,
				label: "Second",
				amount: 120000,
				orderIndex: 1,
			});
			const assignment = await admin.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});
			const studentCaller = createCaller(
				makeTestContext({
					role: "student",
					profileOverrides: { id: student.domainUserId },
				}),
			);

			const order = await studentCaller.feeClearance.myCreateOrder({
				feeAssignmentId: assignment.id,
				installmentIds: [first.id],
			});
			const history = await studentCaller.feeClearance.myFinancialHistory();

			expect(Number(order.amount)).toBe(80000);
			expect(order.installmentIds).toEqual([first.id]);
			expect(history[0]?.balance).toBe(200000);
			expect(history[0]?.feeStructure?.installments).toHaveLength(2);
			await expect(
				studentCaller.feeClearance.myCreateOrder({
					feeAssignmentId: assignment.id,
					installmentIds: [first.id],
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("adds and removes installments", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "With installments",
				totalAmount: 300000,
				currency: "XAF",
			});

			const t1 = await caller.feeClearance.addInstallment({
				feeStructureId: structure.id,
				label: "1ère tranche",
				amount: 150000,
				orderIndex: 0,
			});
			const t2 = await caller.feeClearance.addInstallment({
				feeStructureId: structure.id,
				label: "2ème tranche",
				amount: 150000,
				orderIndex: 1,
			});

			const fetched = await caller.feeClearance.getStructure({
				id: structure.id,
			});
			expect(fetched.installments).toHaveLength(2);
			expect(fetched.installments[0].label).toBe("1ère tranche");

			await caller.feeClearance.deleteInstallment({ id: t1.id });
			const fetched2 = await caller.feeClearance.getStructure({
				id: structure.id,
			});
			expect(fetched2.installments).toHaveLength(1);
		});
	});

	// ── Assignment lifecycle ──────────────────────────────────────────

	describe("assignment → payment → clearance lifecycle", () => {
		async function setup() {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			const student = await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Frais annuels",
				totalAmount: 200000,
				currency: "XAF",
			});

			return { caller, ctx, year, student, structure, klass };
		}

		it("assigns a student to a fee structure", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			expect(assignment.status).toBe("unpaid");
			expect(Number(assignment.effectiveAmount)).toBe(200000);
		});

		it("rejects duplicate assignment", async () => {
			const { caller, year, student, structure } = await setup();

			await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await expect(
				caller.feeClearance.assignStudent({
					studentId: student.id,
					academicYearId: year.id,
					feeStructureId: structure.id,
					discountAmount: 0,
				}),
			).rejects.toHaveProperty("code", "CONFLICT");
		});

		it("assignment becomes partial after first payment", async () => {
			const { caller, ctx, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 100000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "bank_transfer",
				reference: "REF-001",
			});

			const updated = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(updated.status).toBe("partial");
		});

		it("assignment becomes paid when fully paid and clearedAt is set", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 200000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			const cleared = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(cleared.status).toBe("paid");
			expect(cleared.clearedAt).not.toBeNull();
		});

		it("rejects payment when assignment is already fully paid", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 200000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			await expect(
				caller.feeClearance.recordPayment({
					feeAssignmentId: assignment.id,
					amount: 1,
					currency: "XAF",
					paymentDate: "2024-10-02",
					paymentMethod: "cash",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects direct payment that would exceed remaining balance", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			// Pay 150000 first, leaving 50000 remaining
			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 150000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			// 100000 > 50000 remaining — should be rejected
			await expect(
				caller.feeClearance.recordPayment({
					feeAssignmentId: assignment.id,
					amount: 100000,
					currency: "XAF",
					paymentDate: "2024-10-02",
					paymentMethod: "cash",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects assignStudent when fee structure belongs to a different academic year", async () => {
			const { caller, student, structure } = await setup();
			const otherYear = await createAcademicYear();

			// structure.academicYearId !== otherYear.id
			await expect(
				caller.feeClearance.assignStudent({
					studentId: student.id,
					academicYearId: otherYear.id,
					feeStructureId: structure.id,
					discountAmount: 0,
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("recalculates status after payment deletion", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 200000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			const payments = await caller.feeClearance.listPayments({
				feeAssignmentId: assignment.id,
			});
			await caller.feeClearance.deletePayment({ paymentId: payments[0].id });

			const reverted = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(reverted.status).toBe("unpaid");
		});

		it("applies discount and recomputes effective amount", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			await caller.feeClearance.updateDiscount({
				assignmentId: assignment.id,
				discountAmount: 50000,
				discountReason: "Scholarship",
			});

			const after = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(Number(after.effectiveAmount)).toBe(150000);
			expect(Number(after.discountAmount)).toBe(50000);
		});

		it("marks student as exempt", async () => {
			const { caller, year, student, structure } = await setup();

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			const exempted = await caller.feeClearance.exemptStudent({
				assignmentId: assignment.id,
				notes: "Full scholarship",
			});

			expect(exempted?.status).toBe("exempt");
			expect(exempted?.clearedAt).not.toBeNull();
		});
	});

	// ── Bulk assignment ───────────────────────────────────────────────

	describe("bulkAssignClass", () => {
		it("assigns all students in a class", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			await createStudent({ class: klass.id });
			await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Bulk structure",
				totalAmount: 100000,
				currency: "XAF",
			});

			const result = await caller.feeClearance.bulkAssignClass({
				classId: klass.id,
				feeStructureId: structure.id,
				skipExisting: true,
			});

			expect(result.assigned).toBe(2);
			expect(result.skipped).toBe(0);
		});

		it("skips already-assigned students when skipExisting=true", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			const student = await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Bulk structure skip",
				totalAmount: 100000,
				currency: "XAF",
			});

			// First assign manually
			await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			const result = await caller.feeClearance.bulkAssignClass({
				classId: klass.id,
				feeStructureId: structure.id,
				skipExisting: true,
			});

			expect(result.skipped).toBe(1);
			expect(result.assigned).toBe(0);
		});
	});

	// ── Gating ───────────────────────────────────────────────────────

	describe("gating rules", () => {
		it("lists all gates with defaults (disabled)", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);

			const rules = await caller.feeClearance.listGatingRules();
			expect(rules.length).toBe(5);
			expect(rules.every((r) => !r.isEnabled)).toBe(true);
		});

		it("toggles a gate on and off", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: true,
			});

			const rules = await caller.feeClearance.listGatingRules();
			const transcriptRule = rules.find((r) => r.gate === "transcript");
			expect(transcriptRule?.isEnabled).toBe(true);

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: false,
			});

			const rules2 = await caller.feeClearance.listGatingRules();
			const transcriptRule2 = rules2.find((r) => r.gate === "transcript");
			expect(transcriptRule2?.isEnabled).toBe(false);
		});
	});

	// ── Payment orders ────────────────────────────────────────────────

	describe("payment orders lifecycle", () => {
		async function setup() {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			const student = await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Frais annuels avec tranches",
				totalAmount: 300000,
				currency: "XAF",
			});

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			return { caller, ctx, year, student, structure, assignment };
		}

		it("creates a pending payment order", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 150000,
				currency: "XAF",
				installmentIds: [],
			});

			expect(order.status).toBe("pending");
			expect(Number(order.amount)).toBe(150000);
		});

		it("confirms a payment order and creates a payment confirmation", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 300000,
				currency: "XAF",
				installmentIds: [],
			});

			const result = await caller.feeClearance.confirmOrder({
				orderId: order.id,
				paymentDate: "2024-10-01",
				paymentMethod: "bank_transfer",
				reference: "BANK-123",
			});

			expect(result.order?.status).toBe("confirmed");
			expect(result.order?.confirmedAt).not.toBeNull();

			const updated = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(updated.status).toBe("paid");
		});

		it("rejects confirming an already-confirmed order", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 150000,
				currency: "XAF",
				installmentIds: [],
			});

			await caller.feeClearance.confirmOrder({
				orderId: order.id,
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			await expect(
				caller.feeClearance.confirmOrder({
					orderId: order.id,
					paymentDate: "2024-10-02",
					paymentMethod: "cash",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("cancels a pending order", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 150000,
				currency: "XAF",
				installmentIds: [],
			});

			const cancelled = await caller.feeClearance.cancelOrder({
				orderId: order.id,
			});

			expect(cancelled?.status).toBe("cancelled");
		});

		it("cannot create order for fully paid assignment", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 300000,
				currency: "XAF",
				installmentIds: [],
			});
			await caller.feeClearance.confirmOrder({
				orderId: order.id,
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			await expect(
				caller.feeClearance.createOrder({
					feeAssignmentId: assignment.id,
					amount: 1,
					currency: "XAF",
					installmentIds: [],
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects confirming an expired order", async () => {
			const { caller, assignment } = await setup();

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 150000,
				currency: "XAF",
				installmentIds: [],
				expiresAt: "2000-01-01T00:00:00Z", // expired datetime in the past
			});

			await expect(
				caller.feeClearance.confirmOrder({
					orderId: order.id,
					paymentDate: "2024-10-01",
					paymentMethod: "cash",
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("rejects bulkAssignClass when fee structure belongs to a different academic year", async () => {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const otherYear = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			await createStudent({ class: klass.id });

			// Structure belongs to otherYear, class belongs to year
			const structure = await caller.feeClearance.createStructure({
				academicYearId: otherYear.id,
				name: "Wrong year structure",
				totalAmount: 100000,
				currency: "XAF",
			});

			await expect(
				caller.feeClearance.bulkAssignClass({
					classId: klass.id,
					feeStructureId: structure.id,
					skipExisting: true,
				}),
			).rejects.toHaveProperty("code", "BAD_REQUEST");
		});

		it("lists orders for an assignment", async () => {
			const { caller, assignment } = await setup();

			await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 100000,
				currency: "XAF",
				installmentIds: [],
			});
			await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 50000,
				currency: "XAF",
				installmentIds: [],
			});

			const list = await caller.feeClearance.listOrders({
				feeAssignmentId: assignment.id,
			});
			expect(list.total).toBe(2);
		});
	});

	// ── assertFeeClearance gate service ──────────────────────────────

	describe("assertFeeClearance", () => {
		async function setupGated() {
			const adminCtx = await adminWithRealProfile();
			const caller = createCaller(adminCtx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			const student = await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Gate test structure",
				totalAmount: 100000,
				currency: "XAF",
			});

			return { caller, adminCtx, year, student, structure, klass };
		}

		it("passes when gate is disabled (no rule)", async () => {
			const { adminCtx, year, student } = await setupGated();
			await expect(
				assertFeeClearance(adminCtx as never, "transcript", {
					studentId: student.id,
					academicYearId: year.id,
				}),
			).resolves.toBeUndefined();
		});

		it("passes when gate is enabled but canOverrideFeeGates is true", async () => {
			const { caller, adminCtx, year, student } = await setupGated();

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: true,
			});

			await expect(
				assertFeeClearance(
					{ ...adminCtx, permissions: { canOverrideFeeGates: true } } as never,
					"transcript",
					{ studentId: student.id, academicYearId: year.id },
				),
			).resolves.toBeUndefined();

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: false,
			});
		});

		it("blocks when gate is enabled and student is unpaid", async () => {
			const { caller, adminCtx, year, student, structure } = await setupGated();

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: true,
			});
			await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			// Use a context WITHOUT canOverrideFeeGates to verify the gate blocks
			const noOverrideCtx = {
				...adminCtx,
				permissions: { ...adminCtx.permissions, canOverrideFeeGates: false },
			};
			await expect(
				assertFeeClearance(noOverrideCtx as never, "transcript", {
					studentId: student.id,
					academicYearId: year.id,
				}),
			).rejects.toHaveProperty("code", "PRECONDITION_FAILED");

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: false,
			});
		});

		it("passes when gate is enabled and student is paid", async () => {
			const { caller, adminCtx, year, student, structure } = await setupGated();

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: true,
			});
			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});
			await caller.feeClearance.recordPayment({
				feeAssignmentId: assignment.id,
				amount: 100000,
				currency: "XAF",
				paymentDate: "2024-10-01",
				paymentMethod: "cash",
			});

			// Even without override permission, a paid student should pass
			const noOverrideCtx = {
				...adminCtx,
				permissions: { ...adminCtx.permissions, canOverrideFeeGates: false },
			};
			await expect(
				assertFeeClearance(noOverrideCtx as never, "transcript", {
					studentId: student.id,
					academicYearId: year.id,
				}),
			).resolves.toBeUndefined();

			await caller.feeClearance.toggleGate({
				gate: "transcript",
				isEnabled: false,
			});
		});
	});

	// ── Bank Import ───────────────────────────────────────────────────────

	describe("bank import", () => {
		async function setup() {
			const ctx = await adminWithRealProfile();
			const caller = createCaller(ctx);
			const year = await createAcademicYear();
			const program = await createProgram();
			const klass = await createClass({
				program: program.id,
				academicYear: year.id,
			});
			const student = await createStudent({ class: klass.id });

			const structure = await caller.feeClearance.createStructure({
				academicYearId: year.id,
				name: "Frais bancaires",
				totalAmount: 200000,
				currency: "XAF",
			});

			const assignment = await caller.feeClearance.assignStudent({
				studentId: student.id,
				academicYearId: year.id,
				feeStructureId: structure.id,
				discountAmount: 0,
			});

			const order = await caller.feeClearance.createOrder({
				feeAssignmentId: assignment.id,
				amount: 200000,
				currency: "XAF",
				installmentIds: [],
				reference: "BANK-REF-001",
			});

			return { caller, ctx, year, student, structure, assignment, order };
		}

		it("preview classifies a matching row as matched", async () => {
			const { caller, order } = await setup();

			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: order.reference!, amount: 200000, date: "2026-01-15" },
				],
			});

			expect(preview.summary.matched).toBe(1);
			expect(preview.summary.unknownRef).toBe(0);
			expect(preview.results[0].status).toBe("matched");
			expect(preview.results[0].orderId).toBe(order.id);
		});

		it("preview classifies unknown reference as unknown_ref", async () => {
			const { caller } = await setup();

			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: "DOES-NOT-EXIST", amount: 50000, date: "2026-01-15" },
				],
			});

			expect(preview.summary.unknownRef).toBe(1);
			expect(preview.results[0].status).toBe("unknown_ref");
		});

		it("preview classifies amount deviation as amount_mismatch", async () => {
			const { caller, order } = await setup();

			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: order.reference!, amount: 100000, date: "2026-01-15" },
				],
			});

			expect(preview.summary.amountMismatch).toBe(1);
			expect(preview.results[0].status).toBe("amount_mismatch");
			expect(preview.results[0].orderAmount).toBe(200000);
		});

		it("underpayment + forceMatchRefs records bank amount and results in partial status", async () => {
			const { caller, order, assignment } = await setup();

			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: order.reference!, amount: 100000, date: "2026-01-15" },
				],
			});
			expect(preview.results[0].status).toBe("amount_mismatch");

			const result = await caller.feeClearance.applyBankImport({
				rows: [
					{ reference: order.reference!, amount: 100000, date: "2026-01-15" },
				],
				paymentMethod: "bank_transfer",
				forceMatchRefs: [order.reference!],
			});

			expect(result.applied).toBe(1);
			expect(result.errors.length).toBe(0);

			const updated = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			// Recorded 100k against a 200k assignment → partial, not paid
			expect(updated.status).toBe("partial");
			// Payment amount must be the actual bank amount, not the order amount
			const payments = updated.payments ?? [];
			expect(payments.length).toBe(1);
			expect(Number(payments[0].amount)).toBe(100000);
		});

		it("overpayment + forceMatchRefs is rejected without mutating the assignment", async () => {
			const { caller, order, assignment } = await setup();

			// Bank says 250,000 but order is for 200,000 → overpayment
			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: order.reference!, amount: 250000, date: "2026-01-15" },
				],
			});
			expect(preview.results[0].status).toBe("amount_mismatch");

			const result = await caller.feeClearance.applyBankImport({
				rows: [
					{ reference: order.reference!, amount: 250000, date: "2026-01-15" },
				],
				paymentMethod: "bank_transfer",
				forceMatchRefs: [order.reference!],
			});

			// Overpayment must be an error, never applied
			expect(result.applied).toBe(0);
			expect(result.errors.length).toBe(1);
			expect(result.errors[0].reference).toBe(order.reference!);

			// Assignment untouched
			const updated = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(updated.status).toBe("unpaid");
		});

		it("applyBankImport confirms matched orders and marks assignment paid", async () => {
			const { caller, order, assignment } = await setup();

			const result = await caller.feeClearance.applyBankImport({
				rows: [
					{ reference: order.reference!, amount: 200000, date: "2026-01-15" },
				],
				paymentMethod: "bank_transfer",
			});

			expect(result.applied).toBe(1);
			expect(result.errors.length).toBe(0);

			const updated = await caller.feeClearance.getAssignment({
				id: assignment.id,
			});
			expect(updated.status).toBe("paid");
		});

		it("applyBankImport then preview marks already-confirmed order as duplicate", async () => {
			const { caller, order } = await setup();

			await caller.feeClearance.applyBankImport({
				rows: [
					{ reference: order.reference!, amount: 200000, date: "2026-01-15" },
				],
				paymentMethod: "bank_transfer",
			});

			const preview = await caller.feeClearance.previewBankImport({
				rows: [
					{ reference: order.reference!, amount: 200000, date: "2026-01-15" },
				],
			});

			expect(preview.summary.duplicate).toBe(1);
			expect(preview.results[0].status).toBe("duplicate");
		});
	});
});

// ── previewStructureImpact ────────────────────────────────────────────────────

describe("previewStructureImpact", () => {
	it("year-only scope includes all classes in the academic year", async () => {
		const ctx = await adminWithRealProfile();
		const caller = createCaller(ctx);
		const year = await createAcademicYear();

		const structure = await caller.feeClearance.createStructure({
			academicYearId: year.id,
			name: "Year-scoped",
			totalAmount: 100000,
			currency: "XAF",
		});

		const class1 = await createClass({ academicYear: year.id });
		const class2 = await createClass({ academicYear: year.id });
		await createStudent({ class: class1.id });
		await createStudent({ class: class2.id });

		const result = await caller.feeClearance.previewStructureImpact({
			feeStructureId: structure.id,
		});

		const classIds = result.classes.map((c) => c.classId);
		expect(classIds).toContain(class1.id);
		expect(classIds).toContain(class2.id);
		expect(result.totals.totalStudents).toBeGreaterThanOrEqual(2);
		expect(result.totals.toAssign).toBeGreaterThanOrEqual(2);
	});

	it("program-scoped structure excludes classes from other programs", async () => {
		const ctx = await adminWithRealProfile();
		const caller = createCaller(ctx);
		const year = await createAcademicYear();
		const program1 = await createProgram();
		const program2 = await createProgram();

		const structure = await caller.feeClearance.createStructure({
			academicYearId: year.id,
			programId: program1.id,
			name: "Program-scoped",
			totalAmount: 100000,
			currency: "XAF",
		});

		const classIn = await createClass({
			academicYear: year.id,
			program: program1.id,
		});
		const classOut = await createClass({
			academicYear: year.id,
			program: program2.id,
		});
		await createStudent({ class: classIn.id });
		await createStudent({ class: classOut.id });

		const result = await caller.feeClearance.previewStructureImpact({
			feeStructureId: structure.id,
		});

		const classIds = result.classes.map((c) => c.classId);
		expect(classIds).toContain(classIn.id);
		expect(classIds).not.toContain(classOut.id);
	});

	it("distinguishes already-assigned students from students to assign", async () => {
		const ctx = await adminWithRealProfile();
		const caller = createCaller(ctx);
		const year = await createAcademicYear();

		const structure = await caller.feeClearance.createStructure({
			academicYearId: year.id,
			name: "Mixed",
			totalAmount: 100000,
			currency: "XAF",
		});

		const klass = await createClass({ academicYear: year.id });
		const student1 = await createStudent({ class: klass.id });
		await createStudent({ class: klass.id });

		await caller.feeClearance.assignStudent({
			studentId: student1.id,
			academicYearId: year.id,
			feeStructureId: structure.id,
			discountAmount: 0,
		});

		const result = await caller.feeClearance.previewStructureImpact({
			feeStructureId: structure.id,
		});

		const classPreview = result.classes.find((c) => c.classId === klass.id);
		expect(classPreview).toBeDefined();
		expect(classPreview!.alreadyAssigned).toBe(1);
		expect(classPreview!.toAssign).toBe(1);
		expect(result.totals.alreadyAssigned).toBeGreaterThanOrEqual(1);
		expect(result.totals.toAssign).toBeGreaterThanOrEqual(1);
	});

	it("tenant isolation — cannot preview another institution's structure", async () => {
		const ctx = await adminWithRealProfile();
		const caller = createCaller(ctx);
		const year = await createAcademicYear();

		const structure = await caller.feeClearance.createStructure({
			academicYearId: year.id,
			name: "Isolated",
			totalAmount: 100000,
			currency: "XAF",
		});

		await setupTestInstitution();
		const ctxB = await adminWithRealProfile();
		const callerB = createCaller(ctxB);

		await expect(
			callerB.feeClearance.previewStructureImpact({
				feeStructureId: structure.id,
			}),
		).rejects.toHaveProperty("code", "NOT_FOUND");
	});
});
