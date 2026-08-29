import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Plus, Search, Settings2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
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
import { trpc } from "@/utils/trpc";

const FEE_TYPE_KEYS: Record<string, string> = {
	tuition: "fees.type_tuition",
	ape: "fees.type_ape",
	other: "fees.type_other",
};
const FEE_TYPE_FB: Record<string, string> = {
	tuition: "Tuition",
	ape: "APE",
	other: "Other",
};

const FEE_TYPES = ["tuition", "ape", "other"] as const;

const quickPaySchema = z.object({
	enrollmentId: z.string().min(1, "Select a student"),
	amount: z.number().int().positive("Enter a valid amount"),
	paymentMethod: z.enum([
		"cash",
		"mtn_momo",
		"orange_money",
		"bank_transfer",
		"campost",
	]),
	note: z.string().max(500).optional(),
});

type QuickPayValues = z.infer<typeof quickPaySchema>;

function QuickRecordPaymentDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{ academicYearId: activeYear?.id ?? "", pageSize: 500 },
		{ enabled: !!activeYear?.id && open },
	);
	const enrollmentOptions = (
		(enrollmentsData?.items ?? []) as Array<{
			enrollment: { id: string };
			student: { firstName: string; lastName: string };
		}>
	).map((e) => ({
		value: e.enrollment.id,
		label: `${e.student.lastName} ${e.student.firstName}`,
	}));

	const record = trpc.finance.recordPayment.useMutation({
		onSuccess: () => {
			utils.finance.listPayments.invalidate();
			onClose();
			reset();
		},
	});

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<QuickPayValues>({
		resolver: zodResolver(quickPaySchema),
		defaultValues: { paymentMethod: "cash" },
	});

	const onSubmit = (data: QuickPayValues) => {
		record.mutate({ ...data });
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("fees.record_payment", "Record payment")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
					<div className="space-y-1.5">
						<Label>
							{t("enrollments.col_student", "Student")}{" "}
							<span className="text-destructive">*</span>
						</Label>
						<Controller
							name="enrollmentId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={enrollmentOptions}
									value={field.value ?? ""}
									onValueChange={field.onChange}
									placeholder={t("common.search", "Search…")}
								/>
							)}
						/>
						{errors.enrollmentId && (
							<p className="text-destructive text-xs">
								{errors.enrollmentId.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label>
							{t("fees.amount_xaf", "Amount (XAF)")}{" "}
							<span className="text-destructive">*</span>
						</Label>
						<Input
							type="number"
							min={1}
							placeholder="50000"
							{...register("amount", { valueAsNumber: true })}
						/>
						{errors.amount && (
							<p className="text-destructive text-xs">
								{errors.amount.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label>
							{t("fees.payment_method", "Payment method")}{" "}
							<span className="text-destructive">*</span>
						</Label>
						<Controller
							name="paymentMethod"
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="cash">
											{t("fees.method_cash", "Cash")}
										</SelectItem>
										<SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
										<SelectItem value="orange_money">Orange Money</SelectItem>
										<SelectItem value="bank_transfer">
											{t("fees.method_bank_transfer", "Bank transfer")}
										</SelectItem>
										<SelectItem value="campost">CamPost</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label>{t("fees.note", "Note")}</Label>
						<Input
							placeholder={t("fees.note_placeholder", "Optional note…")}
							{...register("note")}
						/>
					</div>

					{record.error && (
						<p className="text-destructive text-sm">{record.error.message}</p>
					)}

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

// ─── Fee schedule setup dialog ────────────────────────────────────────────────

const feeScheduleSchema = z.object({
	tuitionAmount: z.number().int().min(0),
	apeAmount: z.number().int().min(0),
	instalments: z
		.array(
			z.object({
				dueDate: z.string().min(1, "Required"),
				amount: z.number().int().min(0),
				label: z.string().max(100).optional(),
			}),
		)
		.optional(),
});
type FeeScheduleValues = z.infer<typeof feeScheduleSchema>;

function FeeScheduleDialog({
	open,
	onClose,
	academicYearId,
}: {
	open: boolean;
	onClose: () => void;
	academicYearId: string;
}) {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const createSchedule = trpc.finance.createSchedule.useMutation({
		onSuccess: () => {
			utils.finance.listSchedules.invalidate();
			onClose();
			reset();
		},
	});

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<FeeScheduleValues>({
		resolver: zodResolver(feeScheduleSchema),
		defaultValues: { tuitionAmount: 0, apeAmount: 0, instalments: [] },
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "instalments",
	});

	const onSubmit = (data: FeeScheduleValues) => {
		createSchedule.mutate({
			academicYearId,
			tuitionAmount: data.tuitionAmount,
			apeAmount: data.apeAmount,
			instalments: data.instalments?.map((ins) => ({
				dueDate: new Date(ins.dueDate),
				amount: ins.amount,
				label: ins.label,
			})),
		});
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("fees.setup_schedule", "Set up fee schedule")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>
								{t("fees.tuition_amount", "Tuition (XAF)")}{" "}
								<span className="text-destructive">*</span>
							</Label>
							<Input
								type="number"
								min={0}
								placeholder="200000"
								{...register("tuitionAmount", { valueAsNumber: true })}
							/>
							{errors.tuitionAmount && (
								<p className="text-destructive text-xs">
									{errors.tuitionAmount.message}
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<Label>{t("fees.ape_amount", "APE (XAF)")}</Label>
							<Input
								type="number"
								min={0}
								placeholder="10000"
								{...register("apeAmount", { valueAsNumber: true })}
							/>
						</div>
					</div>

					{/* Payment instalments */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>{t("fees.instalments", "Payment instalments")}</Label>
							<button
								type="button"
								onClick={() => append({ dueDate: "", amount: 0, label: "" })}
								className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-primary text-xs hover:bg-primary/10"
							>
								<Plus className="h-3 w-3" />
								{t("fees.add_instalment", "Add")}
							</button>
						</div>
						{fields.map((field, idx) => (
							<div key={field.id} className="flex items-center gap-2">
								<Controller
									name={`instalments.${idx}.dueDate`}
									control={control}
									render={({ field: f }) => (
										<DatePicker
											value={f.value ?? ""}
											onChange={f.onChange}
											className="flex-1"
											startMonth={new Date(2020, 0)}
											endMonth={new Date(2035, 11)}
										/>
									)}
								/>
								<Input
									type="number"
									min={0}
									placeholder="XAF"
									className="w-28"
									{...register(`instalments.${idx}.amount`, {
										valueAsNumber: true,
									})}
								/>
								<Input
									placeholder={t("fees.instalment_label", "Label")}
									className="w-28"
									{...register(`instalments.${idx}.label`)}
								/>
								<button
									type="button"
									onClick={() => remove(idx)}
									className="text-muted-foreground hover:text-destructive"
								>
									×
								</button>
							</div>
						))}
					</div>

					{createSchedule.error && (
						<p className="text-destructive text-sm">
							{createSchedule.error.message}
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={onClose}>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={createSchedule.isPending}>
							{createSchedule.isPending
								? t("common.saving", "Saving…")
								: t("fees.create_schedule", "Create schedule")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function FinanceOverview() {
	const { t } = useTranslation();
	const [feeTypeFilter, setFeeTypeFilter] = useState<string>("all");
	const [search, setSearch] = useState("");
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const { data: schedules = [] } = trpc.finance.listSchedules.useQuery(
		{ academicYearId: activeYear?.id ?? "" },
		{ enabled: !!activeYear },
	);

	const { data: payments = [] } = trpc.finance.listPayments.useQuery({
		feeType:
			feeTypeFilter !== "all"
				? (feeTypeFilter as (typeof FEE_TYPES)[number])
				: undefined,
		limit: 200,
	});

	const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

	const formatAmount = (n: number) =>
		new Intl.NumberFormat("fr-CM", {
			style: "currency",
			currency: "XAF",
			maximumFractionDigits: 0,
		}).format(n);

	const formatDate = (d: Date | string) =>
		new Date(d).toLocaleDateString("fr-CM", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});

	const methodLabel = (m: string) =>
		t(`fees.method_${m}`, m.replace(/_/g, " "));

	const filteredPayments = search.trim()
		? payments.filter((p) => {
				const s = search.toLowerCase();
				const studentName =
					`${(p as { studentLastName?: string }).studentLastName ?? ""} ${(p as { studentFirstName?: string }).studentFirstName ?? ""}`.toLowerCase();
				return (
					String(p.amount).includes(s) ||
					p.paymentMethod?.toLowerCase().includes(s) ||
					p.feeType?.toLowerCase().includes(s) ||
					studentName.includes(s)
				);
			})
		: payments;

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl text-foreground">
						{t("finance.title", "Finances")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("finance.subtitle", "Manage tuition fees and payments")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
						<Settings2 className="mr-2 h-4 w-4" />
						{t("fees.setup_fees", "Fee schedule")}
					</Button>
					<Button onClick={() => setPaymentDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						{t("fees.record_payment", "Record payment")}
					</Button>
				</div>
			</div>
			<QuickRecordPaymentDialog
				open={paymentDialogOpen}
				onClose={() => setPaymentDialogOpen(false)}
			/>
			{activeYear && (
				<FeeScheduleDialog
					open={scheduleDialogOpen}
					onClose={() => setScheduleDialogOpen(false)}
					academicYearId={activeYear.id}
				/>
			)}

			{/* Summary cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<CreditCard className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.total_collected", "Total collected")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">
							{formatAmount(totalCollected)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
						<TrendingUp className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.fee_schedules_count", "Fee schedules configured")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">
							{schedules.length}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
						<CreditCard className="h-6 w-6" />
					</div>
					<div>
						<p className="text-muted-foreground text-sm">
							{t("finance.total_payments", "Payments recorded")}
						</p>
						<p className="font-bold text-2xl text-card-foreground">
							{payments.length}
						</p>
					</div>
				</div>
			</div>

			{/* Fee schedules */}
			{schedules.length > 0 && (
				<div className="overflow-hidden rounded-xl border border-border">
					<div className="flex items-center justify-between border-border border-b bg-muted/30 px-4 py-3">
						<h2 className="font-semibold text-foreground text-sm">
							{t("fees.schedules_title", "Fee schedules")}
						</h2>
					</div>
					<div className="divide-y divide-border">
						{(
							schedules as Array<{
								id: string;
								tuitionAmount: string | number;
								apeAmount: string | number;
								classId: string | null;
							}>
						).map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between px-4 py-3"
							>
								<div className="text-foreground text-sm">
									{s.classId
										? t("fees.schedule_class", "Class schedule")
										: t("fees.schedule_default", "Default schedule")}
								</div>
								<div className="flex gap-4 text-sm">
									<span>
										<span className="text-muted-foreground">
											{t("fees.type_tuition", "Tuition")}:{" "}
										</span>
										<strong>{formatAmount(Number(s.tuitionAmount))}</strong>
									</span>
									{Number(s.apeAmount) > 0 && (
										<span>
											<span className="text-muted-foreground">APE: </span>
											<strong>{formatAmount(Number(s.apeAmount))}</strong>
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1" style={{ minWidth: 200 }}>
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t("finance.search_placeholder", "Search payments…")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select
					value={feeTypeFilter}
					onValueChange={(v) => setFeeTypeFilter(v)}
				>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("finance.all_types", "All types")}
						</SelectItem>
						{FEE_TYPES.map((ft) => (
							<SelectItem key={ft} value={ft}>
								{t(FEE_TYPE_KEYS[ft] ?? "", FEE_TYPE_FB[ft] ?? ft)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Payments table */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex items-center justify-between border-border border-b bg-muted/30 px-4 py-3">
					<h2 className="font-semibold text-foreground text-sm">
						{t("finance.recent_payments", "Recent payments")}
					</h2>
					<span className="text-muted-foreground text-xs">
						{filteredPayments.length} {t("finance.payment_count", "entries")}
					</span>
				</div>

				{filteredPayments.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
						<CreditCard className="h-10 w-10 opacity-20" />
						<p className="font-medium">
							{search || feeTypeFilter !== "all"
								? t(
										"finance.no_payments_filtered",
										"No payments match your filters",
									)
								: t("finance.no_payments", "No payments recorded")}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-border border-b bg-muted/60 text-muted-foreground">
								<tr>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("fees.date", "Date")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("enrollments.col_student", "Student")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("fees.amount", "Amount")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("fees.method", "Method")}
									</th>
									<th className="px-4 py-2 text-left font-medium text-muted-foreground">
										{t("fees.type", "Type")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{filteredPayments.map((p) => (
									<tr key={p.id} className="hover:bg-muted/20">
										<td className="px-4 py-2 text-muted-foreground text-xs">
											{formatDate(p.paidAt)}
										</td>
										<td className="px-4 py-2 text-foreground">
											{(
												p as {
													studentLastName?: string;
													studentFirstName?: string;
												}
											).studentLastName ? (
												`${(p as { studentLastName?: string }).studentLastName} ${(p as { studentFirstName?: string }).studentFirstName}`
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
										<td className="px-4 py-2 font-medium font-mono text-foreground">
											{formatAmount(p.amount)}
										</td>
										<td className="px-4 py-2 text-muted-foreground capitalize">
											{methodLabel(p.paymentMethod)}
										</td>
										<td className="px-4 py-2">
											<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
												{t(
													FEE_TYPE_KEYS[p.feeType ?? ""] ?? "",
													FEE_TYPE_FB[p.feeType ?? ""] ?? p.feeType ?? "—",
												)}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
