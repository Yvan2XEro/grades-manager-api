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
import type { InstallmentOption } from "../types";

export const CreateOrderDialog = createCallable<
	{
		feeAssignmentId: string;
		balance: number;
		currency: string;
		installments: InstallmentOption[];
		onCreated: () => void;
	},
	void
>(({ call, feeAssignmentId, balance, currency, installments, onCreated }) => {
	const { t } = useTranslation();
	const [form, setForm] = useState({
		amount: "",
		notes: "",
		reference: "",
		expiresAt: "",
		installmentIds: [] as string[],
	});

	const mut = useMutation({
		mutationFn: () =>
			trpcClient.feeClearance.createOrder.mutate({
				feeAssignmentId,
				amount: Number(form.amount),
				notes: form.notes || undefined,
				reference: form.reference || undefined,
				expiresAt: form.expiresAt || undefined,
				installmentIds: form.installmentIds.length
					? form.installmentIds
					: undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			onCreated();
			call.end();
			setForm({
				amount: "",
				notes: "",
				reference: "",
				expiresAt: "",
				installmentIds: [],
			});
		},
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.orders.create")}</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-4">
					<div>
						<Label>{t("feeClearance.orders.fields.amount")} *</Label>
						<Input
							type="number"
							min={1}
							placeholder={`${balance.toLocaleString()} ${currency}`}
							value={form.amount}
							onChange={(e) =>
								setForm((f) => ({ ...f, amount: e.target.value }))
							}
						/>
					</div>
					{installments.length > 0 && (
						<div>
							<Label>{t("feeClearance.structures.installments.title")}</Label>
							<div className="mt-1 space-y-1">
								{installments.map((i) => (
									<label key={i.id} className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border"
											checked={form.installmentIds.includes(i.id)}
											onChange={(e) =>
												setForm((f) => ({
													...f,
													installmentIds: e.target.checked
														? [...f.installmentIds, i.id]
														: f.installmentIds.filter((x) => x !== i.id),
												}))
											}
										/>
										{i.label}
									</label>
								))}
							</div>
						</div>
					)}
					<div>
						<Label>{t("feeClearance.orders.fields.reference")}</Label>
						<Input
							value={form.reference}
							placeholder={t("common.optional")}
							onChange={(e) =>
								setForm((f) => ({ ...f, reference: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.orders.fields.expiresAt")}</Label>
						<Input
							type="datetime-local"
							value={form.expiresAt}
							onChange={(e) =>
								setForm((f) => ({ ...f, expiresAt: e.target.value }))
							}
						/>
					</div>
					<div>
						<Label>{t("feeClearance.orders.fields.notes")}</Label>
						<Input
							value={form.notes}
							placeholder={t("common.optional")}
							onChange={(e) =>
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end()}>
						{t("common.cancel")}
					</Button>
					<Button
						disabled={!form.amount || mut.isPending}
						onClick={() => mut.mutate()}
					>
						{t("feeClearance.orders.generate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
