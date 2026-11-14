import type { RouterOutputs } from "@/utils/trpc";

type FeeClearance = RouterOutputs["feeClearance"];

export type FeeStructureRow = FeeClearance["listStructures"][number];
export type FeeStructure = NonNullable<FeeClearance["getStructure"]>;
export type FeeInstallment = NonNullable<FeeStructure["installments"]>[number];

export type FeeAssignmentRow = FeeClearance["listAssignments"]["items"][number];
export type FeeAssignment = NonNullable<FeeClearance["getAssignment"]>;
export type FeePayment = FeeClearance["listPayments"][number];
export type PaymentOrder = FeeClearance["listOrders"]["items"][number];

export type BulkAssignPreview = FeeClearance["previewBulkAssign"];
export type BulkMode = "class" | "program" | "year" | "students";

export type BankImportResult =
	FeeClearance["previewBankImport"]["results"][number];
export type BankImportStatus = BankImportResult["status"];

export type StudentFeeAssignment = FeeClearance["myFinancialHistory"][number];
export type FinancialHistoryEntry =
	FeeClearance["getStudentFinancialHistory"][number];

/** Installment of the student's own view, with its payability. */
export type PayableInstallment = {
	id: string;
	label: string;
	amount: number;
	dueDate: string | null;
	status: "paid" | "pending" | "payable";
};

export type InstallmentOption = { id: string; label: string };

export const ASSIGNMENT_STATUSES = [
	"unpaid",
	"partial",
	"paid",
	"exempt",
] as const;

export const PAYMENT_METHODS = [
	"cash",
	"bank_transfer",
	"mobile_money",
	"check",
	"other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Select value standing for "no filter". */
export const ALL_FILTER_VALUE = "__all__";
