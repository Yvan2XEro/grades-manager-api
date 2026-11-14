import { format } from "date-fns";
import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatMoney } from "../services/fee-format";
import type { PayableInstallment, StudentFeeAssignment } from "../types";
import { GenerateOrderPanel } from "./generate-order-panel";
import {
	DownloadOrderButton,
	DownloadReceiptButton,
} from "./student-fee-downloads";

type StudentOrder = {
	id: string;
	status: string;
	reference: string | null;
	amount: string;
	expiresAt: string | null;
};

/** One fee assignment of the student: amounts, order generation, orders, payments. */
export function StudentAssignmentCard({
	assignment: a,
	currency,
}: {
	assignment: StudentFeeAssignment;
	/** Currency used for the amounts (the one of the student's first assignment). */
	currency: string;
}) {
	const { t } = useTranslation();
	const money = (v: number) => formatMoney(v, currency);
	const balance = a.balance;
	const pendingOrders =
		(a.orders as StudentOrder[] | undefined)?.filter(
			(o) => o.status === "pending",
		) ?? [];
	const canGenerateOrder =
		balance > 0 && a.status !== "exempt" && a.status !== "paid";
	const installments =
		(a.feeStructure?.installments as PayableInstallment[] | undefined) ?? [];

	return (
		<div className="overflow-hidden rounded-xl border shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
				<div>
					<p className="font-semibold">
						{t("feeClearance.student.academicYear")}:{" "}
						{a.academicYear?.name ?? "—"}
					</p>
					{a.feeStructure && (
						<p className="text-muted-foreground text-sm">
							{a.feeStructure.name}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<AssignmentStatusBadge status={a.status} />
				</div>
			</div>
			{canGenerateOrder && (
				<div className="border-b px-4 py-3">
					<GenerateOrderPanel
						assignmentId={a.id}
						balance={balance}
						currency={a.currency}
						installments={installments}
					/>
				</div>
			)}

			{/* Amounts */}
			<div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
				<div>
					<p className="text-muted-foreground">
						{t("feeClearance.assignments.fields.effectiveAmount")}
					</p>
					<p className="font-bold">{money(a.effectiveAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground">
						{t("feeClearance.assignments.fields.paidAmount")}
					</p>
					<p className="font-bold text-emerald-600">{money(a.paidAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground">
						{t("feeClearance.assignments.fields.balance")}
					</p>
					<p
						className={`font-bold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}
					>
						{money(balance)}
					</p>
				</div>
			</div>

			{/* Pending orders */}
			{pendingOrders.length > 0 && (
				<div className="border-t px-4 py-3">
					<p className="mb-2 flex items-center gap-1 font-medium text-amber-700 text-sm">
						<Clock className="h-4 w-4" />
						{t("feeClearance.student.pendingOrders")} ({pendingOrders.length})
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.orders.fields.reference")}
								</TableHead>
								<TableHead>{t("feeClearance.orders.fields.amount")}</TableHead>
								<TableHead>
									{t("feeClearance.orders.fields.expiresAt")}
								</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{pendingOrders.map((o) => (
								<TableRow key={o.id}>
									<TableCell className="font-mono text-xs">
										{o.reference ?? "—"}
									</TableCell>
									<TableCell className="font-medium">
										{Number(o.amount).toLocaleString()} {currency}
									</TableCell>
									<TableCell>
										{o.expiresAt
											? format(new Date(o.expiresAt), "dd/MM/yyyy")
											: "—"}
									</TableCell>
									<TableCell>
										<DownloadOrderButton
											orderId={o.id}
											reference={o.reference}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Confirmed payments */}
			{a.payments.length > 0 && (
				<div className="border-t px-4 py-3">
					<p className="mb-2 flex items-center gap-1 font-medium text-emerald-700 text-sm">
						<CreditCard className="h-4 w-4" />
						{t("feeClearance.payments.title")} ({a.payments.length})
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{t("feeClearance.payments.fields.reference")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.amount")}
								</TableHead>
								<TableHead>
									{t("feeClearance.payments.fields.paymentDate")}
								</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{a.payments.map(
								(p: {
									id: string;
									reference: string | null;
									amount: string | number;
									paymentDate: string;
								}) => (
									<TableRow key={p.id}>
										<TableCell className="font-mono text-xs">
											{p.reference ?? "—"}
										</TableCell>
										<TableCell className="font-medium text-emerald-600">
											{Number(p.amount).toLocaleString()} {currency}
										</TableCell>
										<TableCell>
											{format(new Date(p.paymentDate), "dd/MM/yyyy")}
										</TableCell>
										<TableCell>
											<DownloadReceiptButton
												paymentId={p.id}
												reference={p.reference}
											/>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{a.clearedAt && (
				<div className="flex items-center gap-1 border-t px-4 py-2 text-emerald-600 text-xs">
					<CheckCircle2 className="h-3 w-3" />
					{t("feeClearance.quitus.clearedOn", {
						date: format(new Date(a.clearedAt), "dd/MM/yyyy"),
					})}
				</div>
			)}
		</div>
	);
}
