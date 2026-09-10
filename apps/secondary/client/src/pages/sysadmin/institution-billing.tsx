import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertTriangle,
	CalendarRange,
	CheckCircle2,
	Edit2,
	PauseCircle,
	PlayCircle,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Confirm } from "@/components/callable/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { errorToast } from "@/lib/error-toast";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contract = {
	id: string;
	formula: string;
	params: Record<string, unknown>;
	currency: string;
	billingPeriodMonths: number;
	startDate: string | Date;
	endDate?: string | Date | null;
	status: string;
	notes?: string | null;
	createdAt: string | Date;
};

const contractSchema = z.object({
	formula: z.enum(["per_student", "per_class", "flat", "tiered"]),
	priceAmount: z.number().min(0),
	currency: z.string().min(1).max(3),
	billingPeriodMonths: z.number().int().min(1),
	startDate: z.string().min(1),
	endDate: z.string().optional(),
	notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | Date | null | undefined, locale = "en-GB") {
	if (!d) return "—";
	return new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

function paramsToAmount(params: Record<string, unknown>): number {
	return Number(
		params.pricePerStudent ?? params.pricePerClass ?? params.flatFee ?? 0,
	);
}

// ─── Contract form dialog ─────────────────────────────────────────────────────

function ContractDialog({
	institutionId,
	contract,
	open,
	onClose,
	onDone,
}: {
	institutionId: string;
	contract?: Contract;
	open: boolean;
	onClose: () => void;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const isEdit = !!contract;

	const formulaOptions = [
		{ value: "per_student", label: t("sysadmin.billing.formula_per_student") },
		{ value: "per_class", label: t("sysadmin.billing.formula_per_class") },
		{ value: "flat", label: t("sysadmin.billing.formula_flat") },
		{ value: "tiered", label: t("sysadmin.billing.formula_tiered") },
	] as const;

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
		reset,
	} = useForm<ContractFormData>({
		resolver: zodResolver(contractSchema),
		defaultValues: {
			formula:
				(contract?.formula as ContractFormData["formula"]) ?? "per_student",
			priceAmount: contract ? paramsToAmount(contract.params) : 0,
			currency: contract?.currency ?? "XAF",
			billingPeriodMonths: contract?.billingPeriodMonths ?? 12,
			startDate: contract?.startDate
				? new Date(contract.startDate).toISOString().slice(0, 10)
				: "",
			endDate: contract?.endDate
				? new Date(contract.endDate).toISOString().slice(0, 10)
				: "",
			notes: contract?.notes ?? "",
		},
	});

	const formula = watch("formula");

	function buildParams(data: ContractFormData): Record<string, unknown> {
		if (data.formula === "per_student")
			return { pricePerStudent: data.priceAmount, currency: data.currency };
		if (data.formula === "per_class")
			return { pricePerClass: data.priceAmount, currency: data.currency };
		return { flatFee: data.priceAmount, currency: data.currency };
	}

	const create = trpc.systemAdmin.createBillingContract.useMutation({
		onSuccess: () => {
			onDone();
			reset();
		},
		onError: (err) => errorToast(err, t),
	});
	const update = trpc.systemAdmin.updateBillingContract.useMutation({
		onSuccess: () => {
			onDone();
		},
		onError: (err) => errorToast(err, t),
	});

	const isPending = create.isPending || update.isPending;

	function onSubmit(data: ContractFormData) {
		const payload = {
			formula: data.formula,
			params: buildParams(data),
			currency: data.currency,
			billingPeriodMonths: data.billingPeriodMonths,
			startDate: new Date(data.startDate).toISOString(),
			endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
			notes: data.notes || undefined,
		};
		if (isEdit) {
			update.mutate({ id: contract.id, ...payload });
		} else {
			create.mutate({ institutionId, ...payload });
		}
	}

	const amountLabel =
		formula === "per_student"
			? t("sysadmin.billing.price_per_student")
			: formula === "per_class"
				? t("sysadmin.billing.price_per_class")
				: t("sysadmin.billing.flat_amount");

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit
							? t("sysadmin.billing.edit_contract")
							: t("sysadmin.billing.new_contract")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label>{t("sysadmin.billing.formula")}</Label>
						<Select
							value={formula}
							onValueChange={(v) =>
								setValue("formula", v as ContractFormData["formula"])
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{formulaOptions.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>{amountLabel}</Label>
							<Input
								type="number"
								min={0}
								{...register("priceAmount", { valueAsNumber: true })}
								placeholder="0"
							/>
							{errors.priceAmount && (
								<p className="text-destructive text-xs">
									{errors.priceAmount.message}
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<Label>{t("sysadmin.billing.currency")}</Label>
							<Input
								{...register("currency")}
								placeholder="XAF"
								maxLength={3}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>{t("sysadmin.billing.billing_period_months")}</Label>
						<Input
							type="number"
							min={1}
							{...register("billingPeriodMonths", { valueAsNumber: true })}
							placeholder="12"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>{t("sysadmin.billing.start_date")} *</Label>
							<Input type="date" {...register("startDate")} />
							{errors.startDate && (
								<p className="text-destructive text-xs">
									{errors.startDate.message}
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<Label>{t("sysadmin.billing.end_date")}</Label>
							<Input type="date" {...register("endDate")} />
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>{t("sysadmin.billing.notes")}</Label>
						<textarea
							{...register("notes")}
							placeholder={t("sysadmin.billing.notes_placeholder")}
							rows={2}
							className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending
								? t("common.saving")
								: isEdit
									? t("common.save")
									: t("sysadmin.billing.create_contract")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function InstitutionBillingTab() {
	const { id: institutionId } = useParams<{ id: string }>();
	const { t, i18n } = useTranslation();
	const utils = trpc.useUtils();

	const [showCreate, setShowCreate] = useState(false);
	const [editContract, setEditContract] = useState<Contract | null>(null);

	const formulaOptions = [
		{ value: "per_student", label: t("sysadmin.billing.formula_per_student") },
		{ value: "per_class", label: t("sysadmin.billing.formula_per_class") },
		{ value: "flat", label: t("sysadmin.billing.formula_flat") },
		{ value: "tiered", label: t("sysadmin.billing.formula_tiered") },
	];

	const { data: contracts, isLoading } =
		trpc.systemAdmin.listBillingContracts.useQuery(
			{ institutionId: institutionId! },
			{ enabled: !!institutionId },
		);

	function invalidate() {
		utils.systemAdmin.listBillingContracts.invalidate({
			institutionId: institutionId!,
		});
	}

	const updateStatus = trpc.systemAdmin.updateBillingContract.useMutation({
		onSuccess: invalidate,
		onError: (err) => errorToast(err, t),
	});

	const deleteContract = trpc.systemAdmin.deleteBillingContract.useMutation({
		onSuccess: invalidate,
		onError: (err) => errorToast(err, t),
	});

	const suspendInstitution =
		trpc.systemAdmin.setInstitutionSuspended.useMutation({
			onSuccess: () =>
				utils.systemAdmin.getInstitution.invalidate({ id: institutionId! }),
			onError: (err) => errorToast(err, t),
		});

	function formatContractSummary(contract: Contract): string {
		const amount = paramsToAmount(contract.params);
		const label =
			formulaOptions.find((f) => f.value === contract.formula)?.label ??
			contract.formula;
		if (!amount) return label;
		return `${amount.toLocaleString("fr-FR")} ${contract.currency} — ${label}`;
	}

	function statusBadge(status: string) {
		if (status === "active")
			return (
				<Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					{t("sysadmin.billing.status_active")}
				</Badge>
			);
		if (status === "suspended")
			return (
				<Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10">
					<PauseCircle className="mr-1 h-3 w-3" />
					{t("sysadmin.billing.status_suspended")}
				</Badge>
			);
		return (
			<Badge variant="secondary">
				<AlertTriangle className="mr-1 h-3 w-3" />
				{t("sysadmin.billing.status_cancelled")}
			</Badge>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-foreground text-lg">
						{t("sysadmin.billing.title")}
					</h2>
					<p className="text-muted-foreground text-sm">
						{t("sysadmin.billing.subtitle")}
					</p>
				</div>
				<Button size="sm" onClick={() => setShowCreate(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					{t("sysadmin.billing.new_contract")}
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[1, 2].map((i) => (
						<Skeleton key={i} className="h-24 w-full rounded-xl" />
					))}
				</div>
			) : !contracts?.length ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-border border-dashed py-14 text-center">
					<CalendarRange className="h-8 w-8 text-muted-foreground/50" />
					<div>
						<p className="font-medium text-sm">
							{t("sysadmin.billing.no_contracts")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("sysadmin.billing.no_contracts_desc")}
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowCreate(true)}
					>
						<Plus className="mr-1.5 h-4 w-4" />
						{t("sysadmin.billing.create_contract")}
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{(contracts as Contract[]).map((contract) => (
						<div
							key={contract.id}
							className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
						>
							<div className="min-w-0 space-y-1">
								<div className="flex items-center gap-2">
									{statusBadge(contract.status)}
									<span className="font-medium text-sm">
										{formatContractSummary(contract)}
									</span>
								</div>
								<p className="text-muted-foreground text-xs">
									{t("sysadmin.billing.period_label")} :{" "}
									{contract.billingPeriodMonths} {t("sysadmin.billing.months")}{" "}
									· {formatDate(contract.startDate, i18n.language)}
									{contract.endDate
										? ` → ${formatDate(contract.endDate, i18n.language)}`
										: ` (${t("sysadmin.billing.no_end_date")})`}
								</p>
								{contract.notes && (
									<p className="text-muted-foreground text-xs italic">
										{contract.notes}
									</p>
								)}
							</div>

							<div className="flex shrink-0 gap-1">
								{contract.status === "active" ? (
									<Button
										size="sm"
										variant="ghost"
										className="text-amber-600 hover:text-amber-600"
										disabled={updateStatus.isPending}
										onClick={() =>
											updateStatus.mutate({
												id: contract.id,
												status: "suspended",
											})
										}
									>
										<PauseCircle className="mr-1 h-4 w-4" />
										{t("sysadmin.billing.suspend_contract")}
									</Button>
								) : contract.status === "suspended" ? (
									<Button
										size="sm"
										variant="ghost"
										className="text-emerald-600 hover:text-emerald-600"
										disabled={updateStatus.isPending}
										onClick={() =>
											updateStatus.mutate({ id: contract.id, status: "active" })
										}
									>
										<PlayCircle className="mr-1 h-4 w-4" />
										{t("sysadmin.billing.reactivate_contract")}
									</Button>
								) : null}
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setEditContract(contract)}
								>
									<Edit2 className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={async () => {
										const ok = await Confirm.call({
											title: t("sysadmin.billing.delete_contract_title"),
											description: t("sysadmin.billing.delete_contract_desc"),
											confirmLabel: t("common.delete"),
											destructive: true,
										});
										if (!ok) return;
										deleteContract.mutate({ id: contract.id });
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Suspension rapide de l'établissement */}
			<div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<p className="font-medium text-sm">
							{t("sysadmin.billing.access_suspension")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("sysadmin.billing.access_suspension_desc")}
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400"
						disabled={suspendInstitution.isPending}
						onClick={() =>
							suspendInstitution.mutate({
								institutionId: institutionId!,
								suspended: true,
							})
						}
					>
						<PauseCircle className="mr-1.5 h-4 w-4" />
						{t("sysadmin.billing.suspend_access")}
					</Button>
				</div>
			</div>

			{/* Dialogs */}
			<ContractDialog
				institutionId={institutionId!}
				open={showCreate}
				onClose={() => setShowCreate(false)}
				onDone={() => {
					setShowCreate(false);
					invalidate();
				}}
			/>

			{editContract && (
				<ContractDialog
					institutionId={institutionId!}
					contract={editContract}
					open={!!editContract}
					onClose={() => setEditContract(null)}
					onDone={() => {
						setEditContract(null);
						invalidate();
					}}
				/>
			)}
		</div>
	);
}
