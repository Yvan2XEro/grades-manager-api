import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import type { ImportIssue, ImportStepDef, SheetSummary } from "./types";
import { findDuplicates, normalize, validRows } from "./workbook";
import { requireYear } from "./year-context";

const FEES = "Frais";
const PAYMENTS = "Paiements";
const METHODS: Record<string, schema.FeePaymentMethod> = {
	especes: "cash",
	cash: "cash",
	virement: "bank_transfer",
	"bank transfer": "bank_transfer",
	"mobile money": "mobile_money",
	momo: "mobile_money",
	om: "mobile_money",
	cheque: "check",
	check: "check",
};
const amount = (value: string) =>
	Number(value.replace(/\s/g, "").replace(",", "."));
const isAmount = (value: string) =>
	/^\d+([.,]\d+)?$/.test(value.replace(/\s/g, ""));
const statusOf = (paid: number, due: number): schema.FeeAssignmentStatus =>
	due <= 0 ? "exempt" : paid <= 0 ? "unpaid" : paid >= due ? "paid" : "partial";

/**
 * Fees of a year, for history: what each student owed (with a discount) and
 * what was paid — either as a total, or payment by payment. Re-importing
 * adds only the missing payments, never twice the same one.
 */
export const feesStep: ImportStepDef = {
	key: "year.fees",
	label: "Frais",
	scope: "year",
	sheets: [
		{
			name: FEES,
			description:
				"Facultatif : une ligne par étudiant avec le montant dû pour l'année, la remise éventuelle et le total payé (si les paiements ne sont pas détaillés dans la feuille Paiements).",
			columns: [
				{
					key: "registrationNumber",
					header: "Matricule",
					required: true,
					aliases: ["Registration number"],
				},
				{
					key: "due",
					header: "Montant dû",
					required: true,
					aliases: ["Montant", "Frais", "Amount due"],
				},
				{
					key: "discount",
					header: "Remise",
					aliases: ["Réduction", "Discount"],
				},
				{
					key: "discountReason",
					header: "Motif de la remise",
					width: 24,
					aliases: ["Motif", "Discount reason"],
				},
				{ key: "paid", header: "Total payé", aliases: ["Payé", "Paid"] },
			],
		},
		{
			name: PAYMENTS,
			description:
				"Facultatif : le détail des paiements, une ligne par versement. Un versement déjà enregistré (même date, montant et référence) n'est pas recréé.",
			columns: [
				{
					key: "registrationNumber",
					header: "Matricule",
					required: true,
					aliases: ["Registration number"],
				},
				{
					key: "amount",
					header: "Montant",
					required: true,
					aliases: ["Amount"],
				},
				{
					key: "date",
					header: "Date",
					required: true,
					type: "date",
					hint: "jj/mm/aaaa",
				},
				{
					key: "method",
					header: "Mode",
					hint: "Espèces, Virement, Mobile money, Chèque",
					aliases: ["Mode de paiement", "Method"],
				},
				{
					key: "reference",
					header: "Référence",
					aliases: ["Reçu", "N° reçu", "Reference"],
				},
			],
		},
	],

	async existingRows() {
		return {};
	},

	async plan(rows, ctx) {
		const year = await requireYear(ctx);
		const issues: ImportIssue[] = [
			...findDuplicates(
				FEES,
				rows[FEES],
				(r) => r.values.registrationNumber,
				"Matricule",
			),
		];
		const students = await db
			.select({
				id: schema.students.id,
				registrationNumber: schema.students.registrationNumber,
				program: schema.classes.program,
				cycleLevelId: schema.classes.cycleLevelId,
			})
			.from(schema.enrollments)
			.innerJoin(
				schema.students,
				eq(schema.students.id, schema.enrollments.studentId),
			)
			.innerJoin(
				schema.classes,
				eq(schema.classes.id, schema.enrollments.classId),
			)
			.where(
				and(
					eq(schema.enrollments.academicYearId, year.id),
					eq(schema.enrollments.institutionId, ctx.institutionId),
				),
			);
		const studentByReg = new Map(
			students.map((s) => [s.registrationNumber.trim().toUpperCase(), s]),
		);
		const assignments = students.length
			? await db.query.studentFeeAssignments.findMany({
					where: and(
						eq(schema.studentFeeAssignments.academicYearId, year.id),
						inArray(
							schema.studentFeeAssignments.studentId,
							students.map((s) => s.id),
						),
					),
				})
			: [];
		const assignmentOf = new Map(assignments.map((a) => [a.studentId, a]));
		const payments = assignments.length
			? await db.query.feePayments.findMany({
					where: inArray(
						schema.feePayments.feeAssignmentId,
						assignments.map((a) => a.id),
					),
				})
			: [];
		const error = (
			sheet: string,
			row: number,
			column: string,
			code: string,
			params: Record<string, string | number>,
			message: string,
		) =>
			issues.push({
				sheet,
				row,
				column,
				level: "error",
				code,
				params,
				message,
			});
		const student = (
			sheet: string,
			r: { row: number; values: Record<string, string> },
		) => {
			const found = studentByReg.get(
				r.values.registrationNumber.trim().toUpperCase(),
			);
			if (!found)
				error(
					sheet,
					r.row,
					"Matricule",
					"studentNotInYear",
					{ value: r.values.registrationNumber, year: year.name },
					`No student ${r.values.registrationNumber} enrolled in ${year.name}.`,
				);
			return found;
		};
		const checkAmount = (
			sheet: string,
			row: number,
			column: string,
			value: string,
		) => {
			if (value && !isAmount(value)) {
				error(
					sheet,
					row,
					column,
					"invalidAmount",
					{ value },
					`"${value}" is not an amount.`,
				);
				return false;
			}
			return true;
		};

		type Due = {
			row: number;
			studentId: string;
			program: string;
			cycleLevelId: string;
			due: number;
			discount: number;
			discountReason: string | null;
			paidTotal?: number;
		};
		const dues: Due[] = [];
		for (const r of rows[FEES]) {
			if (r.invalid) continue;
			const s = student(FEES, r);
			if (!s) continue;
			const v = r.values;
			if (
				!checkAmount(FEES, r.row, "Montant dû", v.due) ||
				!checkAmount(FEES, r.row, "Remise", v.discount ?? "") ||
				!checkAmount(FEES, r.row, "Total payé", v.paid ?? "")
			)
				continue;
			dues.push({
				row: r.row,
				studentId: s.id,
				program: s.program,
				cycleLevelId: s.cycleLevelId,
				due: amount(v.due),
				discount: v.discount ? amount(v.discount) : 0,
				discountReason: v.discountReason || null,
				paidTotal: v.paid ? amount(v.paid) : undefined,
			});
		}
		type Payment = {
			row: number;
			studentId: string;
			amount: number;
			date: string;
			method: schema.FeePaymentMethod;
			reference: string | null;
		};
		const detailed: Payment[] = [];
		for (const r of rows[PAYMENTS]) {
			if (r.invalid) continue;
			const s = student(PAYMENTS, r);
			if (!s || !checkAmount(PAYMENTS, r.row, "Montant", r.values.amount))
				continue;
			detailed.push({
				row: r.row,
				studentId: s.id,
				amount: amount(r.values.amount),
				date: r.values.date,
				method: METHODS[normalize(r.values.method ?? "")] ?? "other",
				reference: r.values.reference || null,
			});
		}
		const validFees = new Set(
			validRows(FEES, rows[FEES], issues).map((r) => r.row),
		);
		const validPayments = new Set(
			validRows(PAYMENTS, rows[PAYMENTS], issues).map((r) => r.row),
		);
		const dueList = dues.filter((d) => validFees.has(d.row));
		const paymentList = detailed.filter((p) => validPayments.has(p.row));
		const payable = new Set([
			...assignments.map((a) => a.studentId),
			...dueList.map((d) => d.studentId),
		]);
		for (const p of paymentList)
			if (!payable.has(p.studentId))
				error(
					PAYMENTS,
					p.row,
					"Matricule",
					"noFeeForStudent",
					{},
					"No amount due for this student: add a row to the Frais sheet.",
				);
		const isNewPayment = (p: Payment) => {
			const a = assignmentOf.get(p.studentId);
			return !payments.some(
				(x) =>
					x.feeAssignmentId === a?.id &&
					x.paymentDate === p.date &&
					Number(x.amount) === p.amount &&
					(x.reference ?? null) === p.reference,
			);
		};
		const newPayments = paymentList.filter(
			(p) => payable.has(p.studentId) && isNewPayment(p),
		);

		const feeSummary: SheetSummary = {
			sheet: FEES,
			create: dueList.filter((d) => !assignmentOf.has(d.studentId)).length,
			update: dueList.filter((d) => {
				const a = assignmentOf.get(d.studentId);
				return a && Number(a.effectiveAmount) !== d.due - d.discount;
			}).length,
			unchanged: 0,
			skipped: rows[FEES].length - dueList.length,
		};
		feeSummary.unchanged =
			dueList.length - feeSummary.create - feeSummary.update;
		const paymentSummary: SheetSummary = {
			sheet: PAYMENTS,
			create: newPayments.length,
			update: 0,
			unchanged: paymentList.length - newPayments.length,
			skipped: rows[PAYMENTS].length - paymentList.length,
		};

		return {
			sheets: [feeSummary, paymentSummary],
			issues,
			async apply(log, journal) {
				if (!ctx.actorId)
					throw new Error("An actor is required to record payments");
				// One fee structure per program and level, for the imported amounts
				const structures = await db.query.feeStructures.findMany({
					where: and(
						eq(schema.feeStructures.institutionId, ctx.institutionId),
						eq(schema.feeStructures.academicYearId, year.id),
					),
				});
				const structureFor = async (d: Due) => {
					const found = structures.find(
						(s) =>
							s.programId === d.program && s.cycleLevelId === d.cycleLevelId,
					);
					if (found) return found.id;
					const [created] = await db
						.insert(schema.feeStructures)
						.values({
							institutionId: ctx.institutionId,
							academicYearId: year.id,
							programId: d.program,
							cycleLevelId: d.cycleLevelId,
							name: `Imported fees ${year.name}`,
							totalAmount: d.due.toFixed(2),
							createdBy: ctx.actorId,
						})
						.returning();
					structures.push(created);
					return created.id;
				};
				const ids = new Map(assignments.map((a) => [a.studentId, a.id]));
				for (const d of dueList) {
					const effective = (d.due - d.discount).toFixed(2);
					const current = assignmentOf.get(d.studentId);
					if (current) {
						if (Number(current.effectiveAmount) !== Number(effective)) {
							const set = {
								effectiveAmount: effective,
								discountAmount: d.discount.toFixed(2),
								discountReason: d.discountReason,
							};
							journal.updated(
								"studentFeeAssignments",
								current.id,
								current,
								set,
							);
							await db
								.update(schema.studentFeeAssignments)
								.set(set)
								.where(eq(schema.studentFeeAssignments.id, current.id));
						}
						continue;
					}
					const [created] = await db
						.insert(schema.studentFeeAssignments)
						.values({
							institutionId: ctx.institutionId,
							studentId: d.studentId,
							academicYearId: year.id,
							feeStructureId: await structureFor(d),
							effectiveAmount: effective,
							discountAmount: d.discount.toFixed(2),
							discountReason: d.discountReason,
							createdBy: ctx.actorId,
						})
						.returning({ id: schema.studentFeeAssignments.id });
					ids.set(d.studentId, created.id);
					journal.created("studentFeeAssignments", [created.id]);
				}
				const insertPayment = async (
					studentId: string,
					p: Omit<Payment, "row" | "studentId">,
				) => {
					const feeAssignmentId = ids.get(studentId);
					if (!feeAssignmentId) return;
					const [created] = await db
						.insert(schema.feePayments)
						.values({
							institutionId: ctx.institutionId,
							feeAssignmentId,
							amount: p.amount.toFixed(2),
							paymentDate: p.date,
							paymentMethod: p.method,
							reference: p.reference,
							recordedBy: ctx.actorId!,
						})
						.returning({ id: schema.feePayments.id });
					journal.created("feePayments", [created.id]);
				};
				for (const p of newPayments) await insertPayment(p.studentId, p);
				// A paid total without detail: one payment for what is missing
				const detailedStudents = new Set(paymentList.map((p) => p.studentId));
				for (const d of dueList) {
					if (d.paidTotal === undefined || detailedStudents.has(d.studentId))
						continue;
					const already = payments
						.filter(
							(p) => p.feeAssignmentId === assignmentOf.get(d.studentId)?.id,
						)
						.reduce((n, p) => n + Number(p.amount), 0);
					if (d.paidTotal > already)
						await insertPayment(d.studentId, {
							amount: d.paidTotal - already,
							date: String(year.endDate).slice(0, 10),
							method: "other",
							reference: "Import",
						});
				}
				// Status from what is now paid
				for (const [studentId, assignmentId] of ids) {
					const a = await db.query.studentFeeAssignments.findFirst({
						where: eq(schema.studentFeeAssignments.id, assignmentId),
					});
					if (!a || !dueList.some((d) => d.studentId === studentId)) continue;
					const paid = (
						await db.query.feePayments.findMany({
							where: eq(schema.feePayments.feeAssignmentId, assignmentId),
						})
					).reduce((n, p) => n + Number(p.amount), 0);
					const status = statusOf(paid, Number(a.effectiveAmount));
					if (status !== a.status) {
						journal.updated("studentFeeAssignments", a.id, a, { status });
						await db
							.update(schema.studentFeeAssignments)
							.set({ status, clearedAt: status === "paid" ? new Date() : null })
							.where(eq(schema.studentFeeAssignments.id, a.id));
					}
				}
				await log(
					`Fees: ${feeSummary.create} created, ${feeSummary.update} updated; ${newPayments.length} payment(s).`,
				);
			},
		};
	},
};
