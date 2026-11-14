import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { createCallable } from "react-call";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { type InstallmentOption, PAYMENT_METHODS } from "../types";

const NO_INSTALLMENT_VALUE = "__none__";

const paymentSchema = z.object({
	amount: z.coerce.number({ invalid_type_error: "Required" }).positive(),
	paymentDate: z.string().min(1, "Required"),
	paymentMethod: z.enum(PAYMENT_METHODS),
	reference: z.string().optional(),
	notes: z.string().optional(),
	installmentId: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export const RecordPaymentDialog = createCallable<
	{
		feeAssignmentId: string;
		installments: InstallmentOption[];
		onRecorded: () => void;
	},
	void
>(({ call, feeAssignmentId, installments, onRecorded }) => {
	const { t } = useTranslation();

	const form = useForm<PaymentForm>({
		resolver: zodResolver(paymentSchema),
		defaultValues: {
			amount: undefined,
			paymentDate: format(new Date(), "yyyy-MM-dd"),
			paymentMethod: "cash",
			reference: "",
			notes: "",
			installmentId: undefined,
		},
	});

	const mut = useMutation({
		mutationFn: (values: PaymentForm) =>
			trpcClient.feeClearance.recordPayment.mutate({
				feeAssignmentId,
				amount: values.amount,
				currency: "XAF",
				paymentDate: values.paymentDate,
				paymentMethod: values.paymentMethod,
				reference: values.reference || undefined,
				notes: values.notes || undefined,
				installmentId: values.installmentId || undefined,
			}),
		onSuccess: () => {
			toast.success(t("common.saved"));
			form.reset();
			onRecorded();
			call.end();
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<Dialog open={!call.ended} onOpenChange={(o) => !o && call.end()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("feeClearance.payments.record")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
					<DialogBody className="space-y-4">
						<div>
							<Label>{t("feeClearance.payments.fields.amount")} *</Label>
							<Input type="number" min={1} {...form.register("amount")} />
							{form.formState.errors.amount && (
								<p className="mt-1 text-destructive text-xs">
									{form.formState.errors.amount.message}
								</p>
							)}
						</div>
						<div>
							<Label>{t("feeClearance.payments.fields.paymentDate")} *</Label>
							<Input type="date" {...form.register("paymentDate")} />
						</div>
						<div>
							<Label>{t("feeClearance.payments.fields.paymentMethod")}</Label>
							<Controller
								control={form.control}
								name="paymentMethod"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PAYMENT_METHODS.map((m) => (
												<SelectItem key={m} value={m}>
													{t(`feeClearance.payments.methods.${m}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div>
							<Label>{t("feeClearance.payments.fields.reference")}</Label>
							<Input {...form.register("reference")} />
						</div>
						<div>
							<Label>{t("feeClearance.bankImport.notes")}</Label>
							<Input
								{...form.register("notes")}
								placeholder={t("common.optional")}
							/>
						</div>
						{installments.length > 0 && (
							<div>
								<Label>{t("feeClearance.structures.installments.title")}</Label>
								<Controller
									control={form.control}
									name="installmentId"
									render={({ field }) => (
										<Select
											value={field.value ?? NO_INSTALLMENT_VALUE}
											onValueChange={(v) =>
												field.onChange(
													v === NO_INSTALLMENT_VALUE ? undefined : v,
												)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder={t("common.optional")} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={NO_INSTALLMENT_VALUE}>
													{t("common.none")}
												</SelectItem>
												{installments.map((i) => (
													<SelectItem key={i.id} value={i.id}>
														{i.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						)}
					</DialogBody>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => call.end()}>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={mut.isPending}>
							{t("common.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
