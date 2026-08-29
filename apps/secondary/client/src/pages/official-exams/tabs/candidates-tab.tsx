import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Download, Plus, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { trpc } from "@/utils/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

type Candidate = {
	registration: {
		id: string;
		enrollmentId: string;
		candidateNumber: string | null;
		isEligible: boolean | null;
		hasPaidFee: boolean | null;
		feeAmount: string | null;
		feePaidAt: Date | string | null;
		feeTransactionRef: string | null;
		isAdmitted: boolean | null;
		mention: string | null;
		createdAt: Date | string | null;
	};
	student: {
		id: string;
		firstName: string;
		lastName: string;
		mnu: string | null;
		registrationNumber: string | null;
	};
};

// ─── Register candidate dialog ────────────────────────────────────────────────

const registerSchema = z.object({
	enrollmentId: z.string().min(1, "Select a student"),
	candidateNumber: z.string().max(30).optional(),
	isEligible: z.boolean(),
	hasPaidFee: z.boolean(),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterCandidateDialog({
	examSessionId,
	yearId,
	existingEnrollmentIds,
	onRegistered,
}: {
	examSessionId: string;
	yearId: string;
	existingEnrollmentIds: Set<string>;
	onRegistered: () => void;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		{ academicYearId: yearId, pageSize: 500 },
		{ enabled: !!yearId && open },
	);
	const enrollments = (enrollmentsData?.items ?? []) as Array<{
		enrollment: { id: string; studentId: string };
		student: { id: string; firstName: string; lastName: string };
	}>;

	const availableEnrollments = enrollments.filter(
		(e) => !existingEnrollmentIds.has(e.enrollment.id),
	);

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting, errors },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			enrollmentId: "",
			isEligible: true,
			hasPaidFee: false,
		},
	});

	const registerCandidate = trpc.officialExams.registerCandidate.useMutation();

	const onSubmit = handleSubmit(async (values) => {
		await registerCandidate.mutateAsync({
			examSessionId,
			enrollmentId: values.enrollmentId,
			candidateNumber: values.candidateNumber || undefined,
			isEligible: values.isEligible,
			hasPaidFee: values.hasPaidFee,
		});
		reset();
		setOpen(false);
		onRegistered();
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				reset();
				setOpen(v);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="mr-2 h-4 w-4" />
					{t("official_exams.register_candidate", "Register candidate")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("official_exams.register_candidate", "Register candidate")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					{/* Student */}
					<div className="space-y-1.5">
						<Label>{t("enrollments.col_student", "Student")}</Label>
						<Controller
							name="enrollmentId"
							control={control}
							render={({ field }) => (
								<Combobox
									options={availableEnrollments.map((e) => ({
										value: e.enrollment.id,
										label: `${e.student.lastName} ${e.student.firstName}`,
									}))}
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

					{/* Candidate number */}
					<div className="space-y-1.5">
						<Label>
							{t("official_exams.candidate_number", "Candidate number")}{" "}
							<span className="text-muted-foreground text-xs">
								({t("common.optional", "Optional")})
							</span>
						</Label>
						<Input {...register("candidateNumber")} placeholder="Ex: 0001" />
					</div>

					{/* Flags */}
					<div className="flex items-center gap-6">
						<label className="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								{...register("isEligible")}
								className="h-4 w-4"
							/>
							{t("official_exams.eligible", "Eligible")}
						</label>
						<label className="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								{...register("hasPaidFee")}
								className="h-4 w-4"
							/>
							{t("official_exams.fee_paid", "Fee paid")}
						</label>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								reset();
								setOpen(false);
							}}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? t("common.saving", "Saving…")
								: t("official_exams.register", "Register")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Bulk import dialog ───────────────────────────────────────────────────────

function BulkImportDialog({
	examSessionId,
	academicYearId,
	onImported,
}: {
	examSessionId: string;
	academicYearId: string;
	onImported: () => void;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [selectedClassId, setSelectedClassId] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<{
		registered: number;
		skipped: number;
		skippedNoMnu: number;
	} | null>(null);

	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId, pageSize: 200 },
		{ enabled: !!academicYearId && open },
	);
	const classes = (classesData?.items ?? []) as Array<{
		id: string;
		name: string;
	}>;

	const bulkRegister = trpc.officialExams.bulkRegisterCandidates.useMutation();

	const handleOpen = (v: boolean) => {
		if (!v) {
			setSelectedClassId("");
			setResult(null);
		}
		setOpen(v);
	};

	const handleImport = async () => {
		if (!selectedClassId) return;
		setIsLoading(true);
		try {
			const res = await bulkRegister.mutateAsync({
				examSessionId,
				classId: selectedClassId,
			});
			setResult({
				registered: res.registered,
				skipped: res.skipped,
				skippedNoMnu: (res as { skippedNoMnu?: number }).skippedNoMnu ?? 0,
			});
			setTimeout(() => {
				onImported();
				handleOpen(false);
			}, 1500);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<Users className="mr-2 h-4 w-4" />
					{t("official_exams.import_from_class", "Import from class")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t(
							"official_exams.import_candidates_from_class",
							"Import candidates from class",
						)}
					</DialogTitle>
				</DialogHeader>

				{result ? (
					<div className="flex flex-col items-center gap-3 py-6 text-center">
						<CheckCircle className="h-10 w-10 text-green-500" />
						<p className="font-medium text-foreground">
							{t(
								"official_exams.import_success_registered",
								"{{count}} students registered",
								{
									count: result.registered,
								},
							)}
							{result.skipped > 0 && (
								<>
									{", "}
									{t(
										"official_exams.import_success_skipped",
										"{{count}} already registered (skipped)",
										{
											count: result.skipped,
										},
									)}
								</>
							)}
						</p>
						{result.skippedNoMnu > 0 && (
							<p className="font-medium text-amber-600 text-sm dark:text-amber-400">
								⚠{" "}
								{t(
									"official_exams.import_no_mnu_warning",
									"{{count}} student(s) skipped — no MNU set. Update their student records first.",
									{
										count: result.skippedNoMnu,
									},
								)}
							</p>
						)}
					</div>
				) : (
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label>{t("classes.title", "Class")}</Label>
							<Combobox
								options={classes.map((cls) => ({
									value: cls.id,
									label: cls.name,
								}))}
								value={selectedClassId}
								onValueChange={setSelectedClassId}
								placeholder={t(
									"official_exams.select_class",
									"Select a class…",
								)}
								disabled={isLoading}
							/>
						</div>

						<p className="text-muted-foreground text-sm">
							{t(
								"official_exams.bulk_import_info",
								"All active students enrolled in the selected class will be registered. Students already registered will be skipped.",
							)}
						</p>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpen(false)}
								disabled={isLoading}
							>
								{t("common.cancel", "Cancel")}
							</Button>
							<Button
								type="button"
								onClick={handleImport}
								disabled={!selectedClassId || isLoading}
							>
								{isLoading
									? t("common.loading", "Loading…")
									: t("official_exams.import", "Import")}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ─── Record fee dialog ────────────────────────────────────────────────────────

const feeSchema = z.object({
	feeAmount: z.number().positive("Enter a valid amount"),
	feePaidAt: z.string().min(1, "Enter payment date"),
	feeTransactionRef: z.string().max(100).optional(),
});
type FeeFormValues = z.infer<typeof feeSchema>;

function RecordFeeDialog({
	registrationId,
	onSaved,
}: {
	registrationId: string;
	onSaved: () => void;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const update = trpc.officialExams.updateCandidate.useMutation({
		onSuccess: () => {
			setOpen(false);
			onSaved();
		},
	});
	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<FeeFormValues>({
		resolver: zodResolver(feeSchema),
		defaultValues: { feePaidAt: new Date().toISOString().slice(0, 10) },
	});

	const onSubmit = (values: FeeFormValues) => {
		update.mutate({
			id: registrationId,
			hasPaidFee: true,
			feeAmount: values.feeAmount,
			feePaidAt: new Date(values.feePaidAt).toISOString(),
			feeTransactionRef: values.feeTransactionRef || null,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) reset();
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 font-medium text-muted-foreground text-xs hover:text-foreground"
				>
					{t("official_exams.record_fee", "Record")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{t("official_exams.record_payment_title", "Record fee payment")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
					<div className="space-y-1.5">
						<Label>{t("official_exams.fee_amount", "Amount (FCFA)")} *</Label>
						<Input
							type="number"
							min={1}
							placeholder="18000"
							{...register("feeAmount", { valueAsNumber: true })}
						/>
						{errors.feeAmount && (
							<p className="text-destructive text-xs">
								{errors.feeAmount.message}
							</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label>{t("official_exams.fee_paid_at", "Payment date")} *</Label>
						<Controller
							name="feePaidAt"
							control={control}
							render={({ field }) => (
								<DatePicker
									value={field.value ?? ""}
									onChange={field.onChange}
									startMonth={new Date(2020, 0)}
									endMonth={new Date(2035, 11)}
								/>
							)}
						/>
						{errors.feePaidAt && (
							<p className="text-destructive text-xs">
								{errors.feePaidAt.message}
							</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label>
							{t("official_exams.fee_ref", "Transaction ref")}{" "}
							<span className="text-muted-foreground text-xs">
								({t("common.optional", "optional")})
							</span>
						</Label>
						<Input placeholder="TXN-001" {...register("feeTransactionRef")} />
					</div>
					{update.error && (
						<p className="text-destructive text-xs">{update.error.message}</p>
					)}
					<div className="flex justify-end gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting || update.isPending}>
							{update.isPending
								? t("common.saving", "Saving…")
								: t("official_exams.confirm_payment", "Confirm payment")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ─── Candidate row ────────────────────────────────────────────────────────────

function CandidateRow({
	candidate,
	onUpdate,
}: {
	candidate: Candidate;
	onUpdate: () => void;
}) {
	const { t } = useTranslation();
	const { registration, student } = candidate;

	const update = trpc.officialExams.updateCandidate.useMutation({
		onSuccess: onUpdate,
	});

	const checkElig = trpc.officialExams.checkEligibility.useMutation({
		onSuccess: onUpdate,
	});

	const toggle = (
		field: "isEligible" | "hasPaidFee" | "isAdmitted",
		current: boolean | null,
	) => {
		update.mutate({ id: registration.id, [field]: !current });
	};

	const isCheckingElig = checkElig.isPending;
	const eligResult = checkElig.data;

	return (
		<tr className="border-border border-b hover:bg-muted/20">
			<td className="px-4 py-3">
				<div className="font-medium text-foreground text-sm">
					{student.lastName} {student.firstName}
				</div>
				{student.mnu && (
					<div className="text-muted-foreground text-xs">{student.mnu}</div>
				)}
			</td>
			<td className="px-4 py-3 text-muted-foreground text-sm">
				{registration.candidateNumber ?? "—"}
			</td>
			<td className="px-4 py-3">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						className={`inline-flex h-6 items-center rounded-full px-2.5 font-medium text-xs transition-colors ${
							registration.isEligible
								? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
								: "bg-muted text-muted-foreground"
						}`}
						onClick={() => toggle("isEligible", registration.isEligible)}
						disabled={update.isPending}
					>
						{registration.isEligible
							? t("official_exams.eligible", "Eligible")
							: t("official_exams.not_eligible", "Not eligible")}
					</button>
					<button
						type="button"
						title={
							eligResult
								? `Average: ${eligResult.annualAverage?.toFixed(2) ?? "—"}/20`
								: t(
										"official_exams.check_eligibility",
										"Check from academic records",
									)
						}
						onClick={() =>
							checkElig.mutate({ registrationId: registration.id })
						}
						disabled={isCheckingElig || update.isPending}
						className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
					>
						{isCheckingElig ? (
							<span className="text-xs">…</span>
						) : (
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								className="h-3.5 w-3.5"
							>
								<path
									fillRule="evenodd"
									d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</button>
				</div>
				{eligResult?.annualAverage !== undefined &&
					eligResult.annualAverage !== null && (
						<div className="mt-0.5 text-muted-foreground text-xs">
							{t("official_exams.annual_avg", "Annual avg")}:{" "}
							{eligResult.annualAverage.toFixed(2)}/20
						</div>
					)}
			</td>
			<td className="px-4 py-3">
				{registration.hasPaidFee ? (
					<div className="space-y-0.5">
						<span className="inline-flex h-6 items-center rounded-full bg-blue-100 px-2.5 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
							{registration.feeAmount
								? `${Number(registration.feeAmount).toLocaleString()} FCFA`
								: t("official_exams.fee_paid", "Fee paid")}
						</span>
						{registration.feeTransactionRef && (
							<div className="text-muted-foreground text-xs">
								#{registration.feeTransactionRef}
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center gap-1">
						<span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 font-medium text-muted-foreground text-xs">
							{t("official_exams.fee_pending", "Fee pending")}
						</span>
						<RecordFeeDialog
							registrationId={registration.id}
							onSaved={onUpdate}
						/>
					</div>
				)}
			</td>
			<td className="px-4 py-3">
				{registration.isAdmitted !== null ? (
					<button
						type="button"
						className={`inline-flex h-6 items-center rounded-full px-2.5 font-medium text-xs transition-colors ${
							registration.isAdmitted
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
								: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
						}`}
						onClick={() => toggle("isAdmitted", registration.isAdmitted)}
						disabled={update.isPending}
					>
						{registration.isAdmitted
							? t("official_exams.admitted", "Admitted")
							: t("official_exams.not_admitted", "Not admitted")}
					</button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() =>
							update.mutate({ id: registration.id, isAdmitted: true })
						}
						disabled={update.isPending}
					>
						{t("official_exams.mark_admitted", "Mark admitted")}
					</Button>
				)}
			</td>
			<td className="px-4 py-3 text-muted-foreground text-sm">
				{registration.mention ?? "—"}
			</td>
		</tr>
	);
}

// ─── Main tab component ───────────────────────────────────────────────────────

export function ExamCandidatesTab() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();

	const { data: years = [] } = trpc.academicYears.list.useQuery();
	const activeYear = years.find((y) => y.status === "active") ?? years[0];
	const yearId = activeYear?.id ?? "";

	const { data: session } = trpc.officialExams.getSession.useQuery(
		{ id: id! },
		{ enabled: !!id },
	);
	const s = session as { examType?: string; sessionYear?: number } | undefined;
	useBreadcrumbs([
		{
			label: t("official_exams.title", "Official exams"),
			href: "/official-exams",
		},
		{
			label: s ? `${s.examType} ${s.sessionYear}` : "…",
			href: `/official-exams/${id}`,
		},
		{ label: t("official_exams.tab_candidates", "Candidates") },
	]);
	const academicYearId =
		(session as { academicYearId?: string } | undefined)?.academicYearId ??
		yearId;

	const utils = trpc.useUtils();

	const { data: candidates = [], isLoading: candidatesLoading } =
		trpc.officialExams.listCandidates.useQuery(
			{ examSessionId: id! },
			{ enabled: !!id },
		);

	const typedCandidates = candidates as Candidate[];
	const existingEnrollmentIds = new Set(
		typedCandidates.map((c) => c.registration.enrollmentId),
	);

	const onUpdate = () => {
		utils.officialExams.listCandidates.invalidate({ examSessionId: id! });
	};

	const exportCsv = () => {
		const header = [
			"N° candidat",
			"Nom",
			"Prénom",
			"MNU",
			"Éligible",
			"Frais payés",
			"Montant (FCFA)",
			"Réf transaction",
			"Reçu",
			"Mention",
		];
		const rows = typedCandidates.map((c) => [
			c.registration.candidateNumber ?? "",
			c.student.lastName,
			c.student.firstName,
			c.student.mnu ?? "",
			c.registration.isEligible ? "Oui" : "Non",
			c.registration.hasPaidFee ? "Oui" : "Non",
			c.registration.feeAmount
				? Number(c.registration.feeAmount).toLocaleString()
				: "",
			c.registration.feeTransactionRef ?? "",
			c.registration.isAdmitted ? "Oui" : "Non",
			c.registration.mention ?? "",
		]);
		const csv = [header, ...rows]
			.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `candidats_${s?.examType ?? "exam"}_${s?.sessionYear ?? ""}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			{/* Action bar */}
			<div className="flex items-center justify-end gap-2">
				{typedCandidates.length > 0 && (
					<Button variant="outline" size="sm" onClick={exportCsv}>
						<Download className="mr-1.5 h-4 w-4" />
						{t("official_exams.export_csv", "Export CSV")}
					</Button>
				)}
				{yearId && id && (
					<>
						<BulkImportDialog
							examSessionId={id}
							academicYearId={academicYearId}
							onImported={onUpdate}
						/>
						<RegisterCandidateDialog
							examSessionId={id}
							yearId={yearId}
							existingEnrollmentIds={existingEnrollmentIds}
							onRegistered={onUpdate}
						/>
					</>
				)}
			</div>

			{/* Candidates table */}
			{candidatesLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 5 }, (_, i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</div>
			) : typedCandidates.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-muted-foreground">
					<UserCheck className="h-10 w-10 opacity-20" />
					<p className="font-medium">
						{t("official_exams.no_candidates", "No candidates registered yet.")}
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="border-border border-b bg-muted/60 text-muted-foreground">
							<tr>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("enrollments.col_student", "Student")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("official_exams.candidate_number", "N° candidat")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("official_exams.eligible", "Eligibility")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("official_exams.fee", "Fee")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("official_exams.result", "Result")}
								</th>
								<th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
									{t("official_exams.mention", "Mention")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{typedCandidates.map((c) => (
								<CandidateRow
									key={c.registration.id}
									candidate={c}
									onUpdate={onUpdate}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
