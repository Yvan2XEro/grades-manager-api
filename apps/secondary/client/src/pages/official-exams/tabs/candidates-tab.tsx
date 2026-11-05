import { zodResolver } from "@hookform/resolvers/zod";
import {
	CheckCircle,
	Download,
	FileDown,
	Plus,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { createCallable } from "react-call";
import { useMutationFlow } from "react-call/mutation-flow";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import {
	CallableDialog,
	DIALOG_EXIT_MS,
} from "@/components/callable/callable-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { errorToast } from "@/lib/error-toast";
import { EnrollStudentDialog } from "@/pages/enrollments/enroll-student-dialog";
import { type RouterOutputs, trpc } from "@/utils/trpc";

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

/**
 * Registers an enrolled student as candidate. A student not yet enrolled for
 * the year can be enrolled in place from the "+" next to the select.
 */
export const RegisterCandidateDialog = createCallable<
	{
		examSessionId: string;
		yearId: string;
		existingEnrollmentIds: Set<string>;
	},
	RouterOutputs["officialExams"]["registerCandidate"] | undefined
>(({ call, examSessionId, yearId, existingEnrollmentIds }) => {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const enrollmentsInput = { academicYearId: yearId, pageSize: 500 };
	const { data: enrollmentsData } = trpc.enrollments.list.useQuery(
		enrollmentsInput,
		{ enabled: !!yearId },
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
		formState: { errors },
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			enrollmentId: "",
			isEligible: true,
			hasPaidFee: false,
		},
	});

	const registerCandidate = trpc.officialExams.registerCandidate.useMutation();

	// Enrollment rows are joined with the student, so the fresh list is
	// refetched (rather than patched) to get the new row's label.
	const enrollStudent = async () => {
		const enrollment = await EnrollStudentDialog.call({
			academicYearId: yearId,
		});
		if (!enrollment) return;
		await utils.enrollments.list.invalidate(enrollmentsInput);
		const fresh = await utils.enrollments.list.fetch(enrollmentsInput);
		const row = (fresh.items as typeof enrollments).find(
			(e) => e.enrollment.id === enrollment.id,
		);
		return row
			? {
					value: row.enrollment.id,
					label: `${row.student.lastName} ${row.student.firstName}`,
				}
			: undefined;
	};

	const submit = useMutationFlow(
		call,
		async (call, values: RegisterFormValues) => {
			try {
				call.end(
					await registerCandidate.mutateAsync({
						examSessionId,
						enrollmentId: values.enrollmentId,
						candidateNumber: values.candidateNumber || undefined,
						isEligible: values.isEligible,
						hasPaidFee: values.hasPaidFee,
					}),
				);
			} catch (err) {
				errorToast(err, t);
			}
		},
	);

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			title={t("official_exams.register_candidate", "Register candidate")}
		>
			<form onSubmit={handleSubmit(submit)} className="space-y-4">
				{/* Student */}
				<div className="space-y-1.5">
					<Label>{t("enrollments.col_student", "Student")}</Label>
					<Controller
						name="enrollmentId"
						control={control}
						render={({ field }) => (
							<CreatableCombobox
								options={availableEnrollments.map((e) => ({
									value: e.enrollment.id,
									label: `${e.student.lastName} ${e.student.firstName}`,
								}))}
								value={field.value ?? ""}
								onValueChange={field.onChange}
								placeholder={t("common.search", "Search…")}
								onCreate={enrollStudent}
								createLabel={t("enrollments.enroll_btn", "Enroll")}
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
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{submit.pending
							? t("common.saving", "Saving…")
							: t("official_exams.register", "Register")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

// ─── Bulk import dialog ───────────────────────────────────────────────────────

const EXAM_LEVEL: Record<string, "third" | "first" | "terminal"> = {
	BAC: "terminal",
	PROBATOIRE: "first",
	BEPC: "third",
};

type BulkImportResult = {
	registered: number;
	skipped: number;
	skippedNoMnu: number;
};

/** Registers every active student of a class; resolves with the import counts. */
export const BulkImportDialog = createCallable<
	{ examSessionId: string; academicYearId: string; examType?: string },
	BulkImportResult | undefined
>(({ call, examSessionId, academicYearId, examType }) => {
	const { t } = useTranslation();
	const [selectedClassId, setSelectedClassId] = useState("");
	const [result, setResult] = useState<BulkImportResult | null>(null);

	const eligibleLevel = examType ? EXAM_LEVEL[examType] : undefined;
	const { data: classesData } = trpc.classes.list.useQuery(
		{ academicYearId, level: eligibleLevel, pageSize: 200 },
		{ enabled: !!academicYearId },
	);
	const classes = (classesData?.items ?? []) as Array<{
		id: string;
		name: string;
	}>;

	const bulkRegister = trpc.officialExams.bulkRegisterCandidates.useMutation();

	// Keeps the dialog open briefly on the summary before resolving.
	const runImport = useMutationFlow(call, async (call) => {
		if (!selectedClassId) return;
		try {
			const res = await bulkRegister.mutateAsync({
				examSessionId,
				classId: selectedClassId,
			});
			const summary = {
				registered: res.registered,
				skipped: res.skipped,
				skippedNoMnu: (res as { skippedNoMnu?: number }).skippedNoMnu ?? 0,
			};
			setResult(summary);
			setTimeout(() => call.end(summary), 1500);
		} catch (err) {
			errorToast(err, t);
		}
	});
	const isLoading = runImport.pending;

	return (
		<CallableDialog
			call={call}
			dismissValue={result ?? undefined}
			preventDismiss={isLoading}
			title={t(
				"official_exams.import_candidates_from_class",
				"Import candidates from class",
			)}
		>
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
							placeholder={t("official_exams.select_class", "Select a class…")}
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
							onClick={() => call.end(undefined)}
							disabled={isLoading}
						>
							{t("common.cancel", "Cancel")}
						</Button>
						<Button
							type="button"
							onClick={() => runImport()}
							disabled={!selectedClassId || isLoading}
						>
							{isLoading
								? t("common.loading", "Loading…")
								: t("official_exams.import", "Import")}
						</Button>
					</div>
				</div>
			)}
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

// ─── Record fee dialog ────────────────────────────────────────────────────────

const feeSchema = z.object({
	feeAmount: z.number().positive("Enter a valid amount"),
	feePaidAt: z.string().min(1, "Enter payment date"),
	feeTransactionRef: z.string().max(100).optional(),
});
type FeeFormValues = z.infer<typeof feeSchema>;

/** Records an exam fee payment; resolves with the updated registration. */
export const RecordFeeDialog = createCallable<
	{ registrationId: string },
	RouterOutputs["officialExams"]["updateCandidate"] | undefined
>(({ call, registrationId }) => {
	const { t } = useTranslation();
	const update = trpc.officialExams.updateCandidate.useMutation();
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FeeFormValues>({
		resolver: zodResolver(feeSchema),
		defaultValues: { feePaidAt: new Date().toISOString().slice(0, 10) },
	});

	const submit = useMutationFlow(call, async (call, values: FeeFormValues) => {
		try {
			call.end(
				await update.mutateAsync({
					id: registrationId,
					hasPaidFee: true,
					feeAmount: values.feeAmount,
					feePaidAt: new Date(values.feePaidAt).toISOString(),
					feeTransactionRef: values.feeTransactionRef || null,
				}),
			);
		} catch (err) {
			errorToast(err, t);
		}
	});

	return (
		<CallableDialog
			call={call}
			dismissValue={undefined}
			preventDismiss={submit.pending}
			className="max-w-sm"
			title={t("official_exams.record_payment_title", "Record fee payment")}
		>
			<form onSubmit={handleSubmit(submit)} className="space-y-4 pt-2">
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
				<div className="flex justify-end gap-2 pt-1">
					<Button
						type="button"
						variant="outline"
						disabled={submit.pending}
						onClick={() => call.end(undefined)}
					>
						{t("common.cancel", "Cancel")}
					</Button>
					<Button type="submit" disabled={submit.pending}>
						{submit.pending
							? t("common.saving", "Saving…")
							: t("official_exams.confirm_payment", "Confirm payment")}
					</Button>
				</div>
			</form>
		</CallableDialog>
	);
}, DIALOG_EXIT_MS);

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
		onError: (err) => errorToast(err, t),
	});

	const checkElig = trpc.officialExams.checkEligibility.useMutation({
		onSuccess: onUpdate,
		onError: (err) => errorToast(err, t),
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
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-2 font-medium text-muted-foreground text-xs hover:text-foreground"
							onClick={async () => {
								if (
									await RecordFeeDialog.call({
										registrationId: registration.id,
									})
								)
									onUpdate();
							}}
						>
							{t("official_exams.record_fee", "Record")}
						</Button>
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
		{ label: t("nav.dashboard", "Dashboard"), href: "/" },
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

	const printEligibilityList =
		trpc.officialExams.printEligibilityList.useMutation({
			onSuccess: (result) => {
				const link = document.createElement("a");
				link.href = `data:application/pdf;base64,${result.pdfBase64}`;
				link.download = result.filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			},
			onError: (err) => errorToast(err, t),
		});

	const printCandidateList = trpc.officialExams.printCandidateList.useMutation({
		onSuccess: (result) => {
			const link = document.createElement("a");
			link.href = `data:application/pdf;base64,${result.pdfBase64}`;
			link.download = result.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},
		onError: (err) => errorToast(err, t),
	});

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
					<>
						<Button
							variant="outline"
							size="sm"
							disabled={printEligibilityList.isPending}
							onClick={() =>
								id && printEligibilityList.mutate({ examSessionId: id })
							}
						>
							<FileDown className="mr-1.5 h-4 w-4" />
							{printEligibilityList.isPending
								? t("common.loading", "Loading…")
								: t(
										"official_exams.print_eligibility_list",
										"Eligibility list",
									)}
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={printCandidateList.isPending}
							onClick={() =>
								id && printCandidateList.mutate({ examSessionId: id })
							}
						>
							<FileDown className="mr-1.5 h-4 w-4" />
							{printCandidateList.isPending
								? t("common.loading", "Loading…")
								: t("official_exams.print_candidate_list", "Candidate list")}
						</Button>
						<Button variant="outline" size="sm" onClick={exportCsv}>
							<Download className="mr-1.5 h-4 w-4" />
							{t("official_exams.export_csv", "Export CSV")}
						</Button>
					</>
				)}
				{yearId && id && (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={async () => {
								if (
									await BulkImportDialog.call({
										examSessionId: id,
										academicYearId,
									})
								)
									onUpdate();
							}}
						>
							<Users className="mr-2 h-4 w-4" />
							{t("official_exams.import_from_class", "Import from class")}
						</Button>
						<Button
							size="sm"
							onClick={async () => {
								if (
									await RegisterCandidateDialog.call({
										examSessionId: id,
										yearId,
										existingEnrollmentIds,
									})
								)
									onUpdate();
							}}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("official_exams.register_candidate", "Register candidate")}
						</Button>
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
