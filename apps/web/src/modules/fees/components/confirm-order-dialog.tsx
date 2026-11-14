import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import type { PaymentMethod } from "../types";

/**
 * Confirms a payment order with the actual payment details; resolves `true`
 * once confirmed.
 */
export const ConfirmOrderDialog = createCallable<
	{ orderId: string; onConfirmed: () => void },
	boolean
>(({ call, orderId, onConfirmed }) => {
	const { t } = useTranslation();
	const [paymentDate, setPaymentDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [reference, setReference] = useState("");
	const [notes, setNotes] = useState("");

	const confirmOrder = useMutationFlow(call, async (call) => {
		try {
			await trpcClient.feeClearance.confirmOrder.mutate({
				orderId,
				paymentDate,
				paymentMethod: paymentMethod as PaymentMethod,
				reference: reference || undefined,
				notes: notes || undefined,
			});
			toast.success(t("feeClearance.orders.confirmed"));
			onConfirmed();
			call.end(true);
		} catch (err) {
			toast.error((err as Error).message);
		}
	});

	return (
		<AlertDialog
			open={!call.ended}
			onOpenChange={(o) => !o && !confirmOrder.pending && call.end(false)}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("feeClearance.orders.confirmTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("feeClearance.orders.confirmDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="grid gap-3 px-1 py-2">
					<div className="grid gap-1">
						<label
							className="font-medium text-sm"
							htmlFor="confirm-payment-date"
						>
							{t("feeClearance.orders.fields.paymentDate", {
								defaultValue: "Payment date",
							})}
						</label>
						<input
							id="confirm-payment-date"
							type="date"
							className="rounded-md border px-3 py-1.5 text-sm"
							value={paymentDate}
							onChange={(e) => setPaymentDate(e.target.value)}
						/>
					</div>
					<div className="grid gap-1">
						<label
							className="font-medium text-sm"
							htmlFor="confirm-payment-method"
						>
							{t("feeClearance.orders.fields.paymentMethod", {
								defaultValue: "Payment method",
							})}
						</label>
						<select
							id="confirm-payment-method"
							className="rounded-md border px-3 py-1.5 text-sm"
							value={paymentMethod}
							onChange={(e) => setPaymentMethod(e.target.value)}
						>
							<option value="cash">Cash</option>
							<option value="bank_transfer">Bank transfer</option>
							<option value="mobile_money">Mobile money</option>
							<option value="check">Check</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div className="grid gap-1">
						<label className="font-medium text-sm" htmlFor="confirm-reference">
							{t("feeClearance.orders.fields.reference")}
						</label>
						<input
							id="confirm-reference"
							type="text"
							className="rounded-md border px-3 py-1.5 text-sm"
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder={t("common.optional")}
						/>
					</div>
					<div className="grid gap-1">
						<label className="font-medium text-sm" htmlFor="confirm-notes">
							{t("feeClearance.orders.fields.notes")}
						</label>
						<input
							id="confirm-notes"
							type="text"
							className="rounded-md border px-3 py-1.5 text-sm"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("common.optional")}
						/>
					</div>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={confirmOrder.pending}>
						{t("common.cancel")}
					</AlertDialogCancel>
					<Button
						disabled={confirmOrder.pending}
						onClick={() => confirmOrder()}
					>
						{t("feeClearance.orders.confirm")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}, DIALOG_EXIT_MS);
