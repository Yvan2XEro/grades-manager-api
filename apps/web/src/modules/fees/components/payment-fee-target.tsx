import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import type { PaymentContext } from "../hooks/use-record-payment";

/**
 * What the payment applies to, for a student paid from their profile: the
 * student's fees for the year with the remaining balance, or — without fees
 * yet — the fee structure to assign together with the payment.
 */
export function PaymentFeeTarget({
	context,
	studentName,
	structureId,
	onStructureChange,
}: {
	context: PaymentContext;
	studentName: string;
	structureId: string | undefined;
	onStructureChange: (id: string) => void;
}) {
	const { t } = useTranslation();
	const year = context.academicYear.name;
	const { assignment, structures } = context;

	if (assignment) {
		return (
			<div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 text-sm">
				<div className="col-span-2">
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.payments.noFees.structure")}
					</p>
					<p className="font-medium">{assignment.feeStructure?.name ?? "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.payments.summary.paid")}
					</p>
					<p className="font-medium tabular-nums">
						{formatMoney(assignment.paidAmount, assignment.currency)}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{t("feeClearance.payments.summary.balance")}
					</p>
					<p className="font-semibold text-destructive tabular-nums">
						{formatMoney(assignment.balance, assignment.currency)}
					</p>
				</div>
			</div>
		);
	}

	if (structures.length === 0) {
		return (
			<div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
				<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
				<p>{t("feeClearance.payments.noFees.none", { year })}</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
			<div className="flex gap-2">
				<Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<div>
					<p className="font-medium">
						{t("feeClearance.payments.noFees.title", { year })}
					</p>
					<p className="text-muted-foreground">
						{t("feeClearance.payments.noFees.description", {
							name: studentName,
						})}
					</p>
				</div>
			</div>
			<div className="space-y-1">
				<Label>{t("feeClearance.payments.noFees.structure")} *</Label>
				<Select value={structureId} onValueChange={onStructureChange}>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{structures.map((s) => (
							<SelectItem key={s.id} value={s.id}>
								{s.name} — {formatMoney(s.totalAmount, s.currency)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
