import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "../services/fee-format";
import type { FeeAssignment } from "../types";
import { AssignmentStatusBadge } from "./status-badges";
import { UpdateDiscountDialog } from "./update-discount-dialog";

/** Status, due/paid/balance amounts, clearance notice and discount of an assignment. */
export function AssignmentBalanceSummary({
	assignment,
	paidAmount,
	onChanged,
}: {
	assignment: FeeAssignment;
	paidAmount: number;
	onChanged: () => void;
}) {
	const { t } = useTranslation();
	const effectiveAmount = Number(assignment.effectiveAmount);
	const balance = effectiveAmount - paidAmount;
	const money = (v: number) => formatMoney(v, assignment.currency);
	const discount = Number(assignment.discountAmount);
	const isOpen = assignment.status !== "exempt" && assignment.status !== "paid";

	return (
		<>
			<div className="grid grid-cols-4 gap-4 rounded-lg border p-4">
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.status")}
					</p>
					<AssignmentStatusBadge status={assignment.status} />
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.effectiveAmount")}
					</p>
					<p className="font-bold">{money(effectiveAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.paidAmount")}
					</p>
					<p className="font-bold text-green-600">{money(paidAmount)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.assignments.fields.balance")}
					</p>
					<p
						className={cn(
							"font-bold",
							balance > 0 ? "text-destructive" : "text-green-600",
						)}
					>
						{money(balance)}
					</p>
				</div>
			</div>

			{assignment.status === "paid" && assignment.clearedAt && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
					{t("feeClearance.quitus.clearedOn", {
						date: format(new Date(assignment.clearedAt), "dd/MM/yyyy HH:mm"),
					})}
				</div>
			)}

			{isOpen && (
				<div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
					{discount > 0 ? (
						<span>
							<span className="font-medium">
								{t("feeClearance.assignments.fields.discount")}:
							</span>{" "}
							{money(discount)}
							{assignment.discountReason && ` — ${assignment.discountReason}`}
						</span>
					) : (
						<span className="text-muted-foreground">
							{t("feeClearance.assignments.fields.discount")}: —
						</span>
					)}
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto h-7 w-7 p-0"
						onClick={() =>
							UpdateDiscountDialog.call({
								assignmentId: assignment.id,
								currentDiscountAmount: discount,
								currentDiscountReason: assignment.discountReason ?? "",
								currency: assignment.currency,
								onSaved: onChanged,
							})
						}
					>
						<Pencil className="h-3.5 w-3.5" />
					</Button>
				</div>
			)}
		</>
	);
}
