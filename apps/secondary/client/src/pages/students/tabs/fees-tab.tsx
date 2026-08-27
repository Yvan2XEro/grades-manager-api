import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentData = { id: string; firstName: string; lastName: string };

// ─── Record payment form ──────────────────────────────────────────────────────

const recordPaymentSchema = z.object({
	amount: z.number().int().positive("Amount must be positive"),
	paymentMethod: z.enum([
		"cash",
		"mtn_momo",
		"orange_money",
		"bank_transfer",
		"campost",
	]),
	note: z.string().max(500).optional(),
});

type RecordPaymentValues = z.infer<typeof recordPaymentSchema>;

function RecordPaymentDialog({
	enrollmentId,
	open,
	onClose,
}: {
	enrollmentId: string;
	open: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const record = trpc.finance.recordPayment.useMutation({
		onSuccess: () => {
			utils.finance.listPayments.invalidate();
			utils.finance.getBalance.invalidate();
			onClose();
			reset();
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<RecordPaymentValues>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: { paymentMethod: "cash" },
	});

	const onSubmit = (data: RecordPaymentValues) => {
		record.mutate({ enrollmentId, ...data });
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("fees.record_payment", "Record payment")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						label={t("fees.amount_xaf", "Amount (XAF)")}
						error={errors.amount?.message}
						required
					>
						<Input
							type="number"
							min={1}
							placeholder="e.g. 50000"
							{...register("amount", { valueAsNumber: true })}
						/>
					</FormField>

					<FormField
						label={t("fees.payment_method", "Payment method")}
						error={errors.paymentMethod?.message}
						required
					>
						<Select {...register("paymentMethod")}>
							<SelectOption value="cash">
								{t("fees.method_cash", "Cash")}
							</SelectOption>
							<SelectOption value="mtn_momo">MTN Mobile Money</SelectOption>
							<SelectOption value="orange_money">Orange Money</SelectOption>
							<SelectOption value="bank_transfer">
								{t("fees.method_bank_transfer", "Bank transfer")}
							</SelectOption>
							<SelectOption value="campost">CamPost</SelectOption>
						</Select>
					</FormField>

					<FormField
						label={t("fees.note", "Note")}
						error={errors.note?.message}
					>
						<Input
							placeholder={t("fees.note_placeholder", "Optional note…")}
							{...register("note")}
						/>
					</FormField>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={onClose}>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={record.isPending}>
							{record.isPending
								? t("common.saving", "Saving…")
								: t("fees.record", "Record")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function StudentFeesTab() {
	const { t } = useTranslation();
	const student = useOutletContext<StudentData>();
	const [dialogOpen, setDialogOpen] = useState(false);

	// Get active academic year
	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	// Get enrollment for this student in the active year
	const { data: enrollment } = trpc.enrollments.getByStudent.useQuery(
		{ studentId: student.id, academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	// Get payments and balance
	const { data: payments = [] } = trpc.finance.listPayments.useQuery(
		{ enrollmentId: enrollment?.id ?? "" },
		{ enabled: !!enrollment },
	);

	const { data: balance = 0 } = trpc.finance.getBalance.useQuery(
		{ enrollmentId: enrollment?.id ?? "" },
		{ enabled: !!enrollment },
	);

	const formatAmount = (n: number) =>
		new Intl.NumberFormat("fr-CM", {
			style: "currency",
			currency: "XAF",
			maximumFractionDigits: 0,
		}).format(n);

	const formatDate = (d: Date | string) => new Date(d).toLocaleDateString();

	const methodLabel = (m: string) => {
		const map: Record<string, string> = {
			cash: "Cash",
			mtn_momo: "MTN MoMo",
			orange_money: "Orange Money",
			bank_transfer: "Bank transfer",
			campost: "CamPost",
		};
		return map[m] ?? m;
	};

	if (!activeYear) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-4 py-16">
					<CreditCard className="h-12 w-12 text-muted-foreground opacity-30" />
					<p className="font-medium text-muted-foreground">
						{t("fees.no_active_year", "No active academic year found.")}
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!enrollment) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-4 py-16">
					<CreditCard className="h-12 w-12 text-muted-foreground opacity-30" />
					<p className="font-medium text-muted-foreground">
						{t(
							"fees.not_enrolled",
							"Student is not enrolled in the current academic year.",
						)}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* Balance summary */}
			<div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
				<div>
					<p className="text-muted-foreground text-sm">
						{t("fees.total_paid", "Total paid")} — {activeYear.name}
					</p>
					<p className="font-bold text-2xl text-card-foreground">
						{formatAmount(balance)}
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="mr-1 h-4 w-4" />
					{t("fees.record_payment", "Record payment")}
				</Button>
			</div>

			{/* Payments list */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("fees.payment_history", "Payment history")}
					</h2>
				</div>

				{payments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
						<CreditCard className="h-8 w-8 opacity-20" />
						<p className="text-sm">
							{t("fees.no_payments", "No payments recorded yet.")}
						</p>
					</div>
				) : (
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/20">
							<tr>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.date", "Date")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.amount", "Amount")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.method", "Method")}
								</th>
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									{t("fees.note", "Note")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{payments.map((p) => (
								<tr key={p.id} className="hover:bg-muted/20">
									<td className="px-4 py-2 text-foreground">
										{formatDate(p.paidAt)}
									</td>
									<td className="px-4 py-2 font-medium text-foreground">
										{formatAmount(p.amount)}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{methodLabel(p.paymentMethod)}
									</td>
									<td className="px-4 py-2 text-muted-foreground">
										{p.note ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Dialog */}
			{dialogOpen && (
				<RecordPaymentDialog
					enrollmentId={enrollment.id}
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
				/>
			)}
		</div>
	);
}
