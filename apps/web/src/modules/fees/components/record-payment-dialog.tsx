import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { DIALOG_EXIT_MS } from "@/components/callable/callable-dialog";
import { AcademicYearSelect } from "@/components/inputs/AcademicYearSelect";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import i18n from "@/i18n";
import { formatMoney } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
	type PaymentTarget,
	type RecordedPayment,
	useRecordPayment,
} from "../hooks/use-record-payment";
import { paymentErrorMessage } from "../services/payment-errors";
import { PAYMENT_METHODS } from "../types";
import { PaymentFeeTarget } from "./payment-fee-target";
import { PaymentRecorded } from "./payment-recorded";
import {
	type PickedStudent,
	StudentSinglePicker,
} from "./student-single-picker";

const NO_INSTALLMENT_VALUE = "__none__";

const paymentSchema = z.object({
	amount: z.coerce
		.number({ error: () => i18n.t("common.validation.required") })
		.positive(),
	paymentDate: z
		.string()
		.min(1, { error: () => i18n.t("common.validation.required") }),
	paymentMethod: z.enum(PAYMENT_METHODS),
	reference: z.string().optional(),
	notes: z.string().optional(),
	installmentId: z.string().optional(),
});
type PaymentFormInput = z.input<typeof paymentSchema>;
type PaymentForm = z.output<typeof paymentSchema>;

/**
 * Takes a payment. From a fee assignment, or from a student's profile: then
 * the year can be chosen and a student without fees for it gets a fee
 * structure assigned in the same step. Ends on a confirmation that offers
 * the receipt.
 */
export const RecordPaymentDialog = createCallable<
	{ target: PaymentTarget; onRecorded: () => void },
	void
>(({ call, target, onRecorded }) => {
	const { t } = useTranslation();
	// Without a student yet (payments page), the cashier picks one first
	const [picked, setPicked] = useState<PickedStudent | null>(null);
	const pickStudent = target.kind === "student" && !target.studentId;
	const effectiveTarget: PaymentTarget =
		pickStudent && picked
			? { ...target, studentId: picked.id, studentName: picked.name }
			: target;
	const studentName = effectiveTarget.studentName;
	const payment = useRecordPayment(effectiveTarget);
	const [recorded, setRecorded] = useState<RecordedPayment | null>(null);

	const form = useForm<PaymentFormInput, unknown, PaymentForm>({
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

	const submit = form.handleSubmit((values) => {
		if (payment.balance > 0 && values.amount > payment.balance) {
			form.setError("amount", {
				message: t("feeClearance.payments.amountMax", {
					amount: formatMoney(payment.balance, payment.currency),
				}),
			});
			return;
		}
		payment.mutation.mutate(values, {
			onSuccess: (result) => {
				setRecorded(result);
				onRecorded();
			},
			onError: (error) => toast.error(paymentErrorMessage(error)),
		});
	});

	const { context } = payment;
	const pending = payment.mutation.isPending;
	const balanceHint =
		payment.balance > 0
			? t("feeClearance.payments.amountMax", {
					amount: formatMoney(payment.balance, payment.currency),
				})
			: null;

	return (
		<Dialog
			open={!call.ended}
			onOpenChange={(o) => !o && !pending && call.end()}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{studentName
							? t("feeClearance.payments.recordFor", { name: studentName })
							: t("feeClearance.payments.record")}
					</DialogTitle>
				</DialogHeader>
				{recorded ? (
					<DialogBody>
						<PaymentRecorded
							payment={recorded}
							studentName={studentName}
							onClose={() => call.end()}
						/>
					</DialogBody>
				) : (
					<form onSubmit={submit}>
						<DialogBody className="space-y-4">
							{pickStudent && (
								<StudentSinglePicker
									value={picked}
									onChange={(student) => {
										setPicked(student);
										payment.setYearId(null);
									}}
								/>
							)}
							{target.kind === "student" && (!pickStudent || picked) && (
								<div className="space-y-1">
									<Label>
										{t("feeClearance.structures.fields.academicYear")}
									</Label>
									<AcademicYearSelect
										value={payment.yearId ?? null}
										onChange={payment.setYearId}
										autoSelectActive={false}
									/>
								</div>
							)}
							{payment.isLoadingContext && (
								<div className="flex justify-center py-4">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}
							{context && (
								<PaymentFeeTarget
									context={context}
									studentName={studentName}
									structureId={payment.structure?.id}
									onStructureChange={payment.setStructureId}
								/>
							)}
							{payment.settled && context?.assignment && (
								<p className="rounded-md border p-3 text-muted-foreground text-sm">
									{t("feeClearance.payments.settled", {
										year: context.academicYear.name,
										status: t(
											`feeClearance.assignments.status.${context.assignment.status}`,
										),
									})}
								</p>
							)}
							{payment.canPay && (
								<>
									<div className="space-y-1">
										<Label>{t("feeClearance.payments.fields.amount")} *</Label>
										<Input
											type="number"
											inputMode="numeric"
											min={1}
											{...form.register("amount")}
										/>
										{form.formState.errors.amount ? (
											<p className="text-destructive text-xs">
												{form.formState.errors.amount.message}
											</p>
										) : (
											balanceHint && (
												<p className="text-muted-foreground text-xs">
													{balanceHint}
												</p>
											)
										)}
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-1">
											<Label>
												{t("feeClearance.payments.fields.paymentDate")} *
											</Label>
											<Controller
												control={form.control}
												name="paymentDate"
												render={({ field }) => (
													<DatePicker
														value={field.value}
														onChange={field.onChange}
														className="w-full"
													/>
												)}
											/>
										</div>
										<div className="space-y-1">
											<Label>
												{t("feeClearance.payments.fields.paymentMethod")}
											</Label>
											<Controller
												control={form.control}
												name="paymentMethod"
												render={({ field }) => (
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
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
									</div>
									{payment.installments.length > 0 && (
										<div className="space-y-1">
											<Label>
												{t("feeClearance.structures.installments.title")}
											</Label>
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
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value={NO_INSTALLMENT_VALUE}>
																{t("common.none")}
															</SelectItem>
															{payment.installments.map((i) => (
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
									<div className="space-y-1">
										<Label>{t("feeClearance.payments.fields.reference")}</Label>
										<Input {...form.register("reference")} />
										<p className="text-muted-foreground text-xs">
											{t("feeClearance.payments.referenceHint")}
										</p>
									</div>
									<div className="space-y-1">
										<Label>{t("feeClearance.bankImport.notes")}</Label>
										<Input
											{...form.register("notes")}
											placeholder={t("common.optional")}
										/>
									</div>
								</>
							)}
						</DialogBody>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={pending}
								onClick={() => call.end()}
							>
								{t("common.cancel")}
							</Button>
							<Button type="submit" disabled={!payment.canPay || pending}>
								{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{t("feeClearance.payments.record")}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}, DIALOG_EXIT_MS);
