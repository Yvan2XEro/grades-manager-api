import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type RouterOutputs, trpc, trpcClient } from "@/utils/trpc";
import type { InstallmentOption, PaymentMethod } from "../types";

/**
 * Who pays: an existing fee assignment (its detail page), or a student and a
 * year (the student's profile, or picked in the dialog: `studentId` empty) —
 * then the student may not have fees yet and a fee structure is assigned
 * with the payment.
 */
export type PaymentTarget =
	| {
			kind: "assignment";
			feeAssignmentId: string;
			studentName: string;
			installments: InstallmentOption[];
			balance: number;
			currency: string;
	  }
	| {
			kind: "student";
			studentId: string;
			studentName: string;
			academicYearId?: string;
	  };

export type PaymentContext =
	RouterOutputs["feeClearance"]["studentPaymentContext"];

export type PaymentValues = {
	amount: number;
	paymentDate: string;
	paymentMethod: PaymentMethod;
	reference?: string;
	notes?: string;
	installmentId?: string;
};

/** What the confirmation shows once the payment is recorded. */
export type RecordedPayment = {
	paymentId: string;
	reference: string | null;
	amount: number;
	paymentDate: string;
	currency: string;
	remaining: number;
	/** Fee structure assigned in the same step, if any. */
	assignedStructure: string | null;
};

/** Balance, fee structure choice and submission of the payment dialog. */
export function useRecordPayment(target: PaymentTarget) {
	const isStudent = target.kind === "student";
	const [yearId, setYearId] = useState<string | undefined>(
		target.kind === "student" ? target.academicYearId : undefined,
	);
	const [structureId, setStructureId] = useState("");

	const contextQuery = useQuery({
		...trpc.feeClearance.studentPaymentContext.queryOptions({
			studentId: target.kind === "student" ? target.studentId : "",
			academicYearId: yearId,
		}),
		enabled: target.kind === "student" && !!target.studentId,
	});
	const context = contextQuery.data;
	const assignment = context?.assignment ?? null;
	const needsStructure = isStudent && !!context && !assignment;
	const structure = needsStructure
		? (context.structures.find((s) => s.id === structureId) ??
			context.structures[0] ??
			null)
		: null;

	const balance =
		target.kind === "assignment"
			? target.balance
			: (assignment?.balance ?? structure?.totalAmount ?? 0);
	const currency =
		target.kind === "assignment"
			? target.currency
			: (assignment?.currency ?? structure?.currency ?? "XAF");
	const installments: InstallmentOption[] =
		target.kind === "assignment"
			? target.installments
			: (assignment?.feeStructure?.installments ??
				structure?.installments ??
				[]);
	/** Paid or exempted: there is nothing to take. */
	const settled =
		!!assignment &&
		(assignment.status === "paid" ||
			assignment.status === "exempt" ||
			assignment.balance <= 0);
	const canPay =
		target.kind === "assignment" ||
		(!!context && !settled && (!!assignment || !!structure));

	const mutation = useMutation({
		mutationFn: async (values: PaymentValues): Promise<RecordedPayment> => {
			const payment = {
				...values,
				currency,
				reference: values.reference || undefined,
				notes: values.notes || undefined,
				installmentId: values.installmentId || undefined,
			};
			const recorded = {
				amount: values.amount,
				paymentDate: values.paymentDate,
				currency,
				remaining: Math.max(balance - values.amount, 0),
			};
			if (target.kind === "assignment") {
				const row = await trpcClient.feeClearance.recordPayment.mutate({
					...payment,
					feeAssignmentId: target.feeAssignmentId,
				});
				return {
					...recorded,
					paymentId: row.id,
					reference: row.reference,
					assignedStructure: null,
				};
			}
			if (!context) throw new Error("Payment context not loaded");
			const result = await trpcClient.feeClearance.recordStudentPayment.mutate({
				...payment,
				studentId: target.studentId,
				academicYearId: context.academicYear.id,
				feeStructureId: structure?.id,
			});
			return {
				...recorded,
				paymentId: result.payment.id,
				reference: result.payment.reference,
				assignedStructure: result.assigned ? (structure?.name ?? null) : null,
			};
		},
	});

	return {
		context,
		isLoadingContext: isStudent && contextQuery.isFetching && !context,
		yearId: yearId ?? context?.academicYear.id,
		setYearId: (id: string | null) => {
			setYearId(id ?? undefined);
			setStructureId("");
		},
		needsStructure,
		structure,
		setStructureId,
		balance,
		currency,
		installments,
		settled,
		canPay,
		mutation,
	};
}
