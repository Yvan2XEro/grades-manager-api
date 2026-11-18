import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createCallable } from "react-call";
import { useTranslation } from "react-i18next";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";

export const UpdateDiscountDialog = createCallable<
	{
		assignmentId: string;
		currentDiscountAmount: number;
		currentDiscountReason: string;
		currency: string;
		onSaved: () => void;
	},
	void
>(
	({
		call,
		assignmentId,
		currentDiscountAmount,
		currentDiscountReason,
		currency,
		onSaved,
	}) => {
		const { t } = useTranslation();
		const [discountAmount, setDiscountAmount] = useState(
			String(currentDiscountAmount || ""),
		);
		const [discountReason, setDiscountReason] = useState(currentDiscountReason);

		const mut = useMutation({
			mutationFn: () =>
				trpcClient.feeClearance.updateDiscount.mutate({
					assignmentId,
					discountAmount: Number(discountAmount),
					discountReason: discountReason || undefined,
				}),
			onSuccess: () => {
				toast.success(t("common.saved"));
				onSaved();
				call.end();
			},
			onError: (e) => toast.error(e.message),
		});

		return (
			<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("feeClearance.assignments.discountLabel")}
						</DialogTitle>
					</DialogHeader>
					<DialogBody className="space-y-4">
						<div>
							<Label>
								{t("feeClearance.assignments.fields.discount")} ({currency})
							</Label>
							<Input
								type="number"
								min={0}
								value={discountAmount}
								onChange={(e) => setDiscountAmount(e.target.value)}
							/>
						</div>
						<div>
							<Label>{t("feeClearance.assignments.discountReasonLabel")}</Label>
							<Input
								value={discountReason}
								placeholder={t("common.optional")}
								onChange={(e) => setDiscountReason(e.target.value)}
							/>
						</div>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={() => call.end()}>
							{t("common.cancel")}
						</Button>
						<Button
							disabled={discountAmount === "" || mut.isPending}
							onClick={() => mut.mutate()}
						>
							{t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
	DIALOG_EXIT_MS,
);
