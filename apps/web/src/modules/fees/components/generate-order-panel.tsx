import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateMyOrder } from "../hooks/use-my-fees";
import type { PayableInstallment } from "../types";

/** Installment checkboxes and the button generating a payment order (student view). */
export function GenerateOrderPanel({
	assignmentId,
	balance,
	currency,
	installments,
}: {
	assignmentId: string;
	balance: number;
	currency: string;
	installments: PayableInstallment[];
}) {
	const { t } = useTranslation();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const selectable = installments.filter((item) => item.status === "payable");
	const selectedAmount = selectable
		.filter((item) => selectedIds.includes(item.id))
		.reduce((sum, item) => sum + item.amount, 0);

	const mutation = useCreateMyOrder(() => setSelectedIds([]));

	return (
		<div className="space-y-3">
			{installments.length > 0 && (
				<div className="grid gap-2">
					{installments.map((installment) => (
						<label
							key={installment.id}
							className="flex items-center gap-3 rounded-md border p-3 text-sm"
						>
							<Checkbox
								checked={selectedIds.includes(installment.id)}
								disabled={installment.status !== "payable"}
								onCheckedChange={(checked) =>
									setSelectedIds((current) =>
										checked
											? [...current, installment.id]
											: current.filter((id) => id !== installment.id),
									)
								}
							/>
							<span className="flex-1">{installment.label}</span>
							<span className="font-medium">
								{installment.amount.toLocaleString()} {currency}
							</span>
							<Badge variant="outline">
								{t(
									`feeClearance.student.installmentStatus.${installment.status}`,
								)}
							</Badge>
						</label>
					))}
				</div>
			)}
			<Button
				size="sm"
				variant="outline"
				onClick={() =>
					mutation.mutate({
						feeAssignmentId: assignmentId,
						amount: installments.length === 0 ? balance : undefined,
						installmentIds: selectedIds,
					})
				}
				disabled={
					mutation.isPending ||
					balance <= 0 ||
					(installments.length > 0 && selectedIds.length === 0)
				}
			>
				{mutation.isPending ? (
					<Loader2 className="mr-1 h-4 w-4 animate-spin" />
				) : (
					<Plus className="mr-1 h-4 w-4" />
				)}
				{t("feeClearance.orders.generate")} (
				{(installments.length > 0 ? selectedAmount : balance).toLocaleString()}{" "}
				{currency})
			</Button>
		</div>
	);
}
