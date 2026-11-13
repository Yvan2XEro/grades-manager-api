import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";

// ── Cameroon geographic data ─────────────────────────────────────────────────
const CMR_REGIONS: Record<string, string[]> = {
	Adamaoua: ["Faro-et-Déo", "Mayo-Banyo", "Mbéré", "Vina"],
	Centre: [
		"Haute-Sanaga",
		"Lékié",
		"Mbam-et-Inoubou",
		"Mbam-et-Kim",
		"Méfou-et-Afamba",
		"Méfou-et-Akono",
		"Mfoundi",
		"Nyong-et-Kellé",
		"Nyong-et-Mfoumou",
		"Nyong-et-So'o",
	],
	Est: ["Boumba-et-Ngoko", "Haut-Nyong", "Kadey", "Lom-et-Djérem"],
	"Extrême-Nord": [
		"Diamaré",
		"Logone-et-Chari",
		"Mayo-Danay",
		"Mayo-Kani",
		"Mayo-Sava",
		"Mayo-Tsanaga",
	],
	Littoral: ["Moungo", "Nkam", "Sanaga-Maritime", "Wouri"],
	Nord: ["Bénoué", "Faro", "Mayo-Rey", "Vina"],
	"Nord-Ouest": [
		"Boyo",
		"Bui",
		"Donga-Mantung",
		"Menchum",
		"Mezam",
		"Momo",
		"Ngo-Ketunjia",
	],
	Ouest: [
		"Bamboutos",
		"Haut-Nkam",
		"Hauts-Plateaux",
		"Koupé-Manengouba",
		"Menoua",
		"Mifi",
		"Ndé",
		"Noun",
	],
	Sud: ["Dja-et-Lobo", "Mvila", "Océan", "Vallée-du-Ntem"],
	"Sud-Ouest": [
		"Fako",
		"Koupé-Manengouba",
		"Lebialem",
		"Manyu",
		"Meme",
		"Ndian",
	],
};
const BAC_SERIES_CMR = [
	"A1",
	"A2",
	"A3",
	"A4",
	"B",
	"C",
	"D",
	"E",
	"F1",
	"F2",
	"F3",
	"F4",
	"G1",
	"G2",
	"G3",
	"TI",
];
const GCE_COMBOS = [
	"Arts",
	"Science",
	"Commerce",
	"Technical",
	"Law & Humanities",
];

// ── Zod schema ───────────────────────────────────────────────────────────────
const wizardSchema = z.object({
	// Step 1 — Identity
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	gender: z.string().min(1),
	dateOfBirth: z.string().min(1),
	exactDateOfBirth: z.boolean().default(true),
	placeOfBirth: z.string().min(1),
	countryOfBirth: z.string().optional(),
	idCardNumber: z.string().min(1),
	maritalStatus: z.string().min(1),
	employmentStatus: z.string().optional(),
	primaryLanguage: z.string().optional(),
	hasDisability: z.boolean().default(false),
	// Step 2 — Contact & Origin
	email: z.string().email(),
	phone: z.string().min(1),
	whatsapp: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	postalBox: z.string().optional(),
	nationality: z.string().min(1),
	studentStatus: z.string().min(1),
	originCountry: z.string().min(1),
	originRegion: z.string().optional(),
	originDepartment: z.string().optional(),
	// Step 3 — BAC
	entryDiplomaType: z.string().min(1),
	bacSeries: z.string().min(1),
	bacYear: z.string().min(1),
	bacMention: z.string().min(1),
	bacAverage: z.string().optional(),
	bacInstitution: z.string().min(1),
	bacCountry: z.string().min(1),
	bacMatricule: z.string().optional(),
	// Step 4 — Prior higher ed
	hasPriorHigherEd: z.boolean().default(false),
	priorInstitution: z.string().optional(),
	priorField: z.string().optional(),
	priorLevel: z.string().optional(),
	priorStartYear: z.string().optional(),
	priorEndYear: z.string().optional(),
	priorResult: z.string().optional(),
	// Step 5 — Program choices
	academicYearId: z.string().min(1),
	programId: z.string().min(1),
	secondChoiceProgramId: z.string().optional(),
	thirdChoiceProgramId: z.string().optional(),
	academicLevel: z.string().min(1),
	trainingType: z.string().optional(),
	personalStatement: z.string().optional(),
	// Step 6 — Family & emergency
	fatherName: z.string().min(1),
	fatherProfession: z.string().min(1),
	fatherPhone: z.string().optional(),
	fatherAlive: z.boolean().default(true),
	motherName: z.string().min(1),
	motherProfession: z.string().min(1),
	motherPhone: z.string().optional(),
	motherAlive: z.boolean().default(true),
	guardianName: z.string().optional(),
	guardianRelation: z.string().optional(),
	guardianPhone: z.string().optional(),
	emergencyContactName: z.string().min(1),
	emergencyContactPhone: z.string().min(1),
	emergencyContactCity: z.string().min(1),
});

type WizardValues = z.infer<typeof wizardSchema>;

const DEFAULT_VALUES: WizardValues = {
	firstName: "",
	lastName: "",
	gender: "",
	dateOfBirth: "",
	exactDateOfBirth: true,
	placeOfBirth: "",
	countryOfBirth: "Cameroun",
	idCardNumber: "",
	maritalStatus: "",
	employmentStatus: "",
	primaryLanguage: "francais",
	hasDisability: false,
	email: "",
	phone: "",
	whatsapp: "",
	address: "",
	city: "",
	postalBox: "",
	nationality: "Camerounaise",
	studentStatus: "camerounais",
	originCountry: "Cameroun",
	originRegion: "",
	originDepartment: "",
	entryDiplomaType: "",
	bacSeries: "",
	bacYear: "",
	bacMention: "",
	bacAverage: "",
	bacInstitution: "",
	bacCountry: "Cameroun",
	bacMatricule: "",
	hasPriorHigherEd: false,
	priorInstitution: "",
	priorField: "",
	priorLevel: "",
	priorStartYear: "",
	priorEndYear: "",
	priorResult: "",
	academicYearId: "",
	programId: "",
	secondChoiceProgramId: "",
	thirdChoiceProgramId: "",
	academicLevel: "",
	trainingType: "initiale",
	personalStatement: "",
	fatherName: "",
	fatherProfession: "",
	fatherPhone: "",
	fatherAlive: true,
	motherName: "",
	motherProfession: "",
	motherPhone: "",
	motherAlive: true,
	guardianName: "",
	guardianRelation: "",
	guardianPhone: "",
	emergencyContactName: "",
	emergencyContactPhone: "",
	emergencyContactCity: "",
};

// Fields to trigger per step (for per-step validation)
type FieldName = keyof WizardValues;
const STEP_FIELDS: Record<number, FieldName[]> = {
	1: [
		"firstName",
		"lastName",
		"gender",
		"dateOfBirth",
		"placeOfBirth",
		"idCardNumber",
		"maritalStatus",
	],
	2: ["email", "phone", "nationality", "studentStatus", "originCountry"],
	3: [
		"entryDiplomaType",
		"bacSeries",
		"bacYear",
		"bacMention",
		"bacInstitution",
		"bacCountry",
	],
	4: [], // conditional — handled in goNext
	5: ["academicYearId", "programId", "academicLevel"],
	6: [
		"fatherName",
		"fatherProfession",
		"motherName",
		"motherProfession",
		"emergencyContactName",
		"emergencyContactPhone",
		"emergencyContactCity",
	],
};

const DRAFT_KEY = "admission_draft_v2";
const TOTAL_STEPS = 8;

function readDraft(): { step: number; form: WizardValues } | null {
	const raw = localStorage.getItem(DRAFT_KEY);
	if (!raw) return null;
	try {
		const d = JSON.parse(raw) as { step: number; form: WizardValues };
		if (d.form && d.step) return d;
	} catch {
		/* ignore */
	}
	return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicationForm() {
	const { t } = useTranslation();

	// Lazy init: detect draft synchronously to prevent the first auto-save
	// from overwriting it before the user decides whether to restore.
	const [hasDraft, setHasDraft] = useState(() => readDraft() !== null);
	const [step, setStep] = useState(1);
	const [certify, setCertify] = useState(false);
	const [certifyError, setCertifyError] = useState(false);
	const [submittedReference, setSubmittedReference] = useState<string | null>(
		null,
	);
	const contentRef = useRef<HTMLDivElement>(null);

	const form = useForm<WizardValues>({
		resolver: zodResolver(wizardSchema),
		defaultValues: DEFAULT_VALUES,
		mode: "onTouched",
	});

	// Auto-save on every field change (subscribe, not watch in render)
	useEffect(() => {
		const { unsubscribe } = form.watch((values) => {
			if (hasDraft) return;
			localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form: values }));
		});
		return unsubscribe;
	}, [form, step, hasDraft]);

	const resumeDraft = () => {
		const draft = readDraft();
		if (!draft) return;
		form.reset(draft.form);
		setStep(draft.step);
		setHasDraft(false);
	};

	const clearDraft = () => {
		localStorage.removeItem(DRAFT_KEY);
		setHasDraft(false);
	};

	const optionsQuery = useQuery(trpc.admissions.publicOptions.queryOptions());
	const programs = optionsQuery.data?.programs ?? [];
	const academicYears = optionsQuery.data?.academicYears ?? [];
	const programId = form.watch("programId");
	const secondChoiceProgramId = form.watch("secondChoiceProgramId");
	const academicYearId = form.watch("academicYearId");

	const submitMutation = useMutation({
		mutationFn: (values: WizardValues) =>
			trpcClient.admissions.submit.mutate({
				applicant: {
					firstName: values.firstName.trim(),
					lastName: values.lastName.trim(),
					email: values.email.trim(),
					phone: values.phone.trim() || undefined,
					dateOfBirth: values.dateOfBirth || undefined,
					nationality: values.nationality.trim() || undefined,
					gender: values.gender || undefined,
					placeOfBirth: values.placeOfBirth.trim() || undefined,
					countryOfBirth: values.countryOfBirth?.trim() || undefined,
					exactDateOfBirth: values.exactDateOfBirth,
					idCardNumber: values.idCardNumber.trim() || undefined,
					maritalStatus: values.maritalStatus || undefined,
					employmentStatus: values.employmentStatus || undefined,
					primaryLanguage: values.primaryLanguage || undefined,
					hasDisability: values.hasDisability,
					whatsapp: values.whatsapp?.trim() || undefined,
					address: values.address?.trim() || undefined,
					city: values.city?.trim() || undefined,
					postalBox: values.postalBox?.trim() || undefined,
					originCountry: values.originCountry?.trim() || undefined,
					originRegion: values.originRegion || undefined,
					originDepartment: values.originDepartment || undefined,
					studentStatus: values.studentStatus || undefined,
					entryDiplomaType: values.entryDiplomaType || undefined,
					bacSeries: values.bacSeries?.trim() || undefined,
					bacYear: values.bacYear?.trim() || undefined,
					bacMention: values.bacMention || undefined,
					bacAverage: values.bacAverage?.trim() || undefined,
					bacInstitution: values.bacInstitution?.trim() || undefined,
					bacCountry: values.bacCountry?.trim() || undefined,
					bacMatricule: values.bacMatricule?.trim() || undefined,
					hasPriorHigherEd: values.hasPriorHigherEd,
					priorInstitution: values.hasPriorHigherEd
						? values.priorInstitution?.trim() || undefined
						: undefined,
					priorField: values.hasPriorHigherEd
						? values.priorField?.trim() || undefined
						: undefined,
					priorLevel: values.hasPriorHigherEd
						? values.priorLevel || undefined
						: undefined,
					priorStartYear: values.hasPriorHigherEd
						? values.priorStartYear?.trim() || undefined
						: undefined,
					priorEndYear: values.hasPriorHigherEd
						? values.priorEndYear?.trim() || undefined
						: undefined,
					priorResult: values.hasPriorHigherEd
						? values.priorResult || undefined
						: undefined,
					fatherName: values.fatherName.trim() || undefined,
					fatherProfession: values.fatherProfession.trim() || undefined,
					fatherPhone: values.fatherPhone?.trim() || undefined,
					fatherAlive: values.fatherAlive,
					motherName: values.motherName.trim() || undefined,
					motherProfession: values.motherProfession.trim() || undefined,
					motherPhone: values.motherPhone?.trim() || undefined,
					motherAlive: values.motherAlive,
					guardianName: values.guardianName?.trim() || undefined,
					guardianRelation: values.guardianRelation?.trim() || undefined,
					guardianPhone: values.guardianPhone?.trim() || undefined,
					emergencyContactName: values.emergencyContactName.trim() || undefined,
					emergencyContactPhone:
						values.emergencyContactPhone.trim() || undefined,
					emergencyContactCity: values.emergencyContactCity.trim() || undefined,
				},
				programId: values.programId,
				secondChoiceProgramId: values.secondChoiceProgramId || undefined,
				thirdChoiceProgramId: values.thirdChoiceProgramId || undefined,
				academicYearId: values.academicYearId,
				academicLevel: values.academicLevel || undefined,
				trainingType: values.trainingType || undefined,
				personalStatement: values.personalStatement?.trim() || undefined,
			}),
		onSuccess: (result) => {
			localStorage.removeItem(DRAFT_KEY);
			setSubmittedReference(result.referenceCode);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	const scrollToTop = () =>
		contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

	const goNext = async () => {
		let fields = STEP_FIELDS[step] ?? [];
		// Step 4: only validate prior fields when toggle is on
		if (step === 4 && form.getValues("hasPriorHigherEd")) {
			fields = ["priorInstitution", "priorField", "priorLevel"] as FieldName[];
		}
		const valid = fields.length === 0 || (await form.trigger(fields));
		if (!valid) {
			scrollToTop();
			return;
		}
		setStep((s) => Math.min(s + 1, TOTAL_STEPS));
		scrollToTop();
	};

	const goBack = () => {
		setStep((s) => Math.max(s - 1, 1));
		scrollToTop();
	};

	const goToStep = (n: number) => {
		setStep(n);
		scrollToTop();
	};

	const handleSubmit = form.handleSubmit((values) => {
		if (!certify) {
			setCertifyError(true);
			return;
		}
		setCertifyError(false);
		submitMutation.mutate(values);
	});

	// ── Success screen ───────────────────────────────────────────────────────
	if (submittedReference) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4 py-10">
				<div className="mx-auto w-full max-w-lg space-y-6 text-center">
					<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
						<CheckCircle2 className="size-10 text-emerald-500" />
					</div>
					<div className="space-y-2">
						<h1 className="font-bold text-3xl">
							{t("admissions.public.successTitle")}
						</h1>
						<p className="text-muted-foreground">
							{t("admissions.public.successDescription")}
						</p>
					</div>
					<div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
						<p className="mb-1 text-muted-foreground text-sm">
							{t("admissions.public.referenceLabel")}
						</p>
						<p className="font-bold font-mono text-3xl text-primary tracking-widest">
							{submittedReference}
						</p>
					</div>
					<Button asChild size="lg" className="w-full">
						<Link to={`/admissions/status?ref=${submittedReference}`}>
							{t("admissions.public.trackApplication")}
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	// ── Draft restore prompt ─────────────────────────────────────────────────
	if (hasDraft) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4">
				<Card className="w-full max-w-md">
					<CardContent className="space-y-6 pt-8 pb-8">
						<div className="space-y-2 text-center">
							<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
								<FileText className="size-6 text-primary" />
							</div>
							<h2 className="font-semibold text-xl">
								{t("admissions.wizard.draftNotice")}
							</h2>
							<p className="text-muted-foreground text-sm">
								Reprendre là où vous en étiez ou recommencer depuis le début.
							</p>
						</div>
						<div className="flex flex-col gap-3">
							<Button onClick={resumeDraft} size="lg">
								{t("admissions.wizard.resumeDraft")}
							</Button>
							<Button variant="outline" onClick={clearDraft} size="lg">
								<RotateCcw className="mr-2 size-4" />
								{t("admissions.wizard.newForm")}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const stepTitles = Array.from({ length: TOTAL_STEPS }, (_, i) =>
		t(`admissions.steps.${i + 1}.title`),
	);

	return (
		<div className="min-h-dvh bg-gradient-to-br from-primary/5 to-background pb-16">
			{/* Header */}
			<div className="border-b bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-3xl px-4 py-4">
					<h1 className="font-semibold text-lg">
						{t("admissions.public.title")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("admissions.public.subtitle")}
					</p>
				</div>
			</div>

			{/* Progress */}
			<div className="border-b bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-3xl px-4 py-3">
					{/* Mobile: bar */}
					<div className="flex items-center gap-3 sm:hidden">
						<span className="whitespace-nowrap font-medium text-sm">
							{t("admissions.wizard.stepOf", {
								current: step,
								total: TOTAL_STEPS,
							})}
						</span>
						<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all duration-500"
								style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
							/>
						</div>
						<span className="whitespace-nowrap text-muted-foreground text-xs">
							{stepTitles[step - 1]}
						</span>
					</div>
					{/* Desktop: dots */}
					<div className="hidden items-center sm:flex">
						{stepTitles.map((title, i) => {
							const n = i + 1;
							const done = n < step;
							const current = n === step;
							return (
								<div key={n} className="flex flex-1 items-center">
									<button
										type="button"
										onClick={() => done && goToStep(n)}
										className={`flex flex-col items-center gap-1 ${done ? "cursor-pointer" : "cursor-default"}`}
									>
										<div
											className={`flex size-7 items-center justify-center rounded-full font-semibold text-xs transition-all duration-300 ${done ? "bg-emerald-500 text-white" : current ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}
										>
											{done ? <CheckCircle2 className="size-4" /> : n}
										</div>
										<span
											className={`text-center text-[10px] leading-tight ${current ? "font-semibold text-primary" : "text-muted-foreground"}`}
										>
											{title}
										</span>
									</button>
									{i < TOTAL_STEPS - 1 && (
										<div
											className={`mx-1 h-0.5 flex-1 transition-all duration-500 ${done ? "bg-emerald-500" : "bg-muted"}`}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Content */}
			<div ref={contentRef} className="mx-auto max-w-3xl px-4 pt-6">
				<div className="mb-4 space-y-0.5">
					<h2 className="font-bold text-2xl">
						{t(`admissions.steps.${step}.title`)}
					</h2>
					<p className="text-muted-foreground">
						{t(`admissions.steps.${step}.subtitle`)}
					</p>
				</div>

				<Form {...form}>
					<Card className="shadow-sm">
						<CardContent className="pt-6 pb-4">
							{step === 1 && <Step1 form={form} t={t} />}
							{step === 2 && <Step2 form={form} t={t} />}
							{step === 3 && <Step3 form={form} t={t} />}
							{step === 4 && <Step4 form={form} t={t} />}
							{step === 5 && (
								<Step5
									form={form}
									t={t}
									programs={programs}
									academicYears={academicYears}
									secondChoiceProgramId={secondChoiceProgramId}
								/>
							)}
							{step === 6 && <Step6 form={form} t={t} />}
							{step === 7 && <Step7 t={t} />}
							{step === 8 && (
								<Step8
									form={form}
									t={t}
									programs={programs}
									academicYears={academicYears}
									goToStep={goToStep}
									certify={certify}
									setCertify={setCertify}
									certifyError={certifyError}
								/>
							)}
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="mt-4 flex items-center justify-between gap-3">
						<Button
							variant="outline"
							onClick={goBack}
							disabled={step === 1}
							className="gap-2"
						>
							<ChevronLeft className="size-4" />
							{t("admissions.wizard.back")}
						</Button>
						<span className="text-muted-foreground text-sm sm:hidden">
							{step} / {TOTAL_STEPS}
						</span>
						{step < TOTAL_STEPS ? (
							<Button onClick={goNext} className="gap-2">
								{t("admissions.wizard.next")}
								<ChevronRight className="size-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={submitMutation.isPending}
								className="gap-2"
							>
								{submitMutation.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<CheckCircle2 className="size-4" />
								)}
								{submitMutation.isPending
									? t("admissions.wizard.submitting")
									: t("admissions.wizard.submit")}
							</Button>
						)}
					</div>
				</Form>
			</div>
		</div>
	);
}

// ── Shared helpers ────────────────────────────────────────────────────────────
type AnyForm = ReturnType<typeof useForm<WizardValues>>;

function Opt({ label }: { label: string }) {
	return (
		<Badge variant="secondary" className="px-1.5 py-0 font-normal text-[10px]">
			{label}
		</Badge>
	);
}

// ── Step 1 — Identity ─────────────────────────────────────────────────────────
function Step1({ form, t }: { form: AnyForm; t: (k: string) => string }) {
	return (
		<div className="grid gap-5 md:grid-cols-2">
			<FormField
				control={form.control}
				name="lastName"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.lastName")}</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : MBALLA" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="firstName"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.firstName")}</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Jean-Paul" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="gender"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.gender")}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="masculin">
									{t("admissions.options.gender.masculin")}
								</SelectItem>
								<SelectItem value="feminin">
									{t("admissions.options.gender.feminin")}
								</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="maritalStatus"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.maritalStatus")}
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{["celibataire", "marie", "divorce", "veuf"].map((v) => (
									<SelectItem key={v} value={v}>
										{t(`admissions.options.maritalStatus.${v}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="space-y-2 md:col-span-2">
				<FormField
					control={form.control}
					name="dateOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.dateOfBirth")}
							</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="exactDateOfBirth"
					render={({ field }) => (
						<FormItem className="flex items-center gap-2 space-y-0">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel className="font-normal text-muted-foreground">
								{t("admissions.fields.exactDateOfBirth")}
							</FormLabel>
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="placeOfBirth"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.placeOfBirth")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Yaoundé" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="countryOfBirth"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.countryOfBirth")} <Opt label="opt." />
						</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="idCardNumber"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.idCardNumber")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : 123456789" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="primaryLanguage"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.primaryLanguage")} <Opt label="opt." />
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value ?? ""}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="francais">
									{t("admissions.options.language.francais")}
								</SelectItem>
								<SelectItem value="anglais">
									{t("admissions.options.language.anglais")}
								</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="employmentStatus"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.employmentStatus")} <Opt label="opt." />
						</FormLabel>
						<Select onValueChange={field.onChange} value={field.value ?? ""}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{[
									"sans_emploi",
									"employe",
									"fonctionnaire",
									"commercant",
									"autre",
								].map((v) => (
									<SelectItem key={v} value={v}>
										{t(`admissions.options.employmentStatus.${v}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="hasDisability"
				render={({ field }) => (
					<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
						<FormControl>
							<Checkbox
								checked={field.value}
								onCheckedChange={field.onChange}
							/>
						</FormControl>
						<FormLabel className="font-normal">
							{t("admissions.fields.hasDisability")}
						</FormLabel>
					</FormItem>
				)}
			/>
		</div>
	);
}

// ── Step 2 — Contact & Origin ─────────────────────────────────────────────────
function Step2({ form, t }: { form: AnyForm; t: (k: string) => string }) {
	const originRegion = form.watch("originRegion");
	const studentStatus = form.watch("studentStatus");
	const departments = CMR_REGIONS[originRegion ?? ""] ?? [];

	return (
		<div className="space-y-6">
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Contact
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.email")}</FormLabel>
								<FormControl>
									<Input
										type="email"
										{...field}
										placeholder="votre@email.com"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.phone")}</FormLabel>
								<FormControl>
									<Input type="tel" {...field} placeholder="6X XX XX XX XX" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="whatsapp"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.whatsapp")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="tel"
										{...field}
										placeholder="Si différent du téléphone"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.city")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Yaoundé" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.address")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="postalBox"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.postalBox")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : 12345" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Nationalité & Origine
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="nationality"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.nationality")}
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Camerounaise" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="studentStatus"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.studentStatus")}
								</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{[
											"camerounais",
											"etranger_cemac",
											"etranger_hors_cemac",
										].map((v) => (
											<SelectItem key={v} value={v}>
												{t(`admissions.options.studentStatus.${v}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="originCountry"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.originCountry")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{studentStatus === "camerounais" && (
						<>
							<FormField
								control={form.control}
								name="originRegion"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("admissions.fields.originRegion")} <Opt label="opt." />
										</FormLabel>
										<Select
											onValueChange={(v) => {
												field.onChange(v);
												form.setValue("originDepartment", "");
											}}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="—" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.keys(CMR_REGIONS).map((r) => (
													<SelectItem key={r} value={r}>
														{r}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							{originRegion && departments.length > 0 && (
								<FormField
									control={form.control}
									name="originDepartment"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("admissions.fields.originDepartment")}{" "}
												<Opt label="opt." />
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="—" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{departments.map((d) => (
														<SelectItem key={d} value={d}>
															{d}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// ── Step 3 — BAC ─────────────────────────────────────────────────────────────
function Step3({ form, t }: { form: AnyForm; t: (k: string) => string }) {
	const diplomaType = form.watch("entryDiplomaType");
	const isCmrBac = diplomaType === "bac_camerounais";
	const isGce = diplomaType === "gce_alevel";
	const seriesOptions = isCmrBac ? BAC_SERIES_CMR : isGce ? GCE_COMBOS : [];

	return (
		<div className="grid gap-5 md:grid-cols-2">
			<div className="md:col-span-2">
				<FormField
					control={form.control}
					name="entryDiplomaType"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.entryDiplomaType")}
							</FormLabel>
							<Select
								onValueChange={(v) => {
									field.onChange(v);
									form.setValue("bacSeries", "");
								}}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{[
										"bac_camerounais",
										"gce_alevel",
										"equivalent_etranger",
										"autre",
									].map((v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.diplomaType.${v}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="bacSeries"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacSeries")}</FormLabel>
						{seriesOptions.length > 0 ? (
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{seriesOptions.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<FormControl>
								<Input {...field} placeholder="Ex : C, D, A-Level..." />
							</FormControl>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacYear"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacYear")}</FormLabel>
						<FormControl>
							<Input
								type="number"
								min={1990}
								max={new Date().getFullYear()}
								{...field}
								placeholder="Ex : 2023"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacMention"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacMention")}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="—" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{["tres_bien", "bien", "assez_bien", "passable", "admis"].map(
									(v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.bacMention.${v}`)}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacAverage"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.bacAverage")} <Opt label="opt." />
						</FormLabel>
						<FormControl>
							<Input
								type="number"
								step="0.01"
								min={0}
								max={20}
								{...field}
								placeholder="Ex : 12.50"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacInstitution"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>
							{t("admissions.fields.bacInstitution")}
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="Ex : Lycée Général Leclerc" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacCountry"
				render={({ field }) => (
					<FormItem>
						<FormLabel required>{t("admissions.fields.bacCountry")}</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="bacMatricule"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.bacMatricule")} <Opt label="opt." />
						</FormLabel>
						<FormControl>
							<Input {...field} placeholder="N° matricule OBC" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}

// ── Step 4 — Prior higher ed ──────────────────────────────────────────────────
function Step4({ form, t }: { form: AnyForm; t: (k: string) => string }) {
	const hasPrior = form.watch("hasPriorHigherEd");

	return (
		<div className="space-y-6">
			<FormField
				control={form.control}
				name="hasPriorHigherEd"
				render={({ field }) => (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => field.onChange(false)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${!field.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
						>
							<p className="font-medium text-sm">
								{t("admissions.wizard.priorHigherEdNo")}
							</p>
						</button>
						<button
							type="button"
							onClick={() => field.onChange(true)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${field.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
						>
							<p className="font-medium text-sm">
								{t("admissions.wizard.priorHigherEdYes")}
							</p>
						</button>
					</div>
				)}
			/>
			{hasPrior && (
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="priorInstitution"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorInstitution")}
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Ex : Université de Yaoundé I"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorField"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorField")}
								</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Informatique" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorLevel"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.priorLevel")}
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{["L1", "L2", "L3", "M1", "M2", "Doctorat"].map((l) => (
											<SelectItem key={l} value={l}>
												{t(`admissions.options.academicLevel.${l}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorResult"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorResult")} <Opt label="opt." />
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{["admis", "non_admis", "en_cours"].map((v) => (
											<SelectItem key={v} value={v}>
												{t(`admissions.options.priorResult.${v}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorStartYear"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorStartYear")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1990}
										max={new Date().getFullYear()}
										{...field}
										placeholder="Ex : 2022"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priorEndYear"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.priorEndYear")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1990}
										max={new Date().getFullYear() + 1}
										{...field}
										placeholder="Ex : 2023"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			)}
		</div>
	);
}

// ── Step 5 — Program choices ──────────────────────────────────────────────────
function Step5({
	form,
	t,
	programs,
	academicYears,
	secondChoiceProgramId,
}: {
	form: AnyForm;
	t: (k: string) => string;
	programs: { id: string; name: string; code: string }[];
	academicYears: { id: string; name: string }[];
	secondChoiceProgramId?: string;
}) {
	const programId = form.watch("programId");
	const thirdChoiceProgramId = form.watch("thirdChoiceProgramId");
	const personalStatement = form.watch("personalStatement") ?? "";

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="academicYearId"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.academicYear")}
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{academicYears.map((y) => (
										<SelectItem key={y.id} value={y.id}>
											{y.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="academicLevel"
					render={({ field }) => (
						<FormItem>
							<FormLabel required>
								{t("admissions.fields.academicLevel")}
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{["L1", "L2", "L3", "M1", "M2", "Doctorat"].map((l) => (
										<SelectItem key={l} value={l}>
											{t(`admissions.options.academicLevel.${l}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="trainingType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("admissions.fields.trainingType")} <Opt label="opt." />
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value ?? ""}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{["initiale", "professionnalisante", "continue"].map((v) => (
										<SelectItem key={v} value={v}>
											{t(`admissions.options.trainingType.${v}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Vœux de formation
				</p>
				<div className="space-y-3">
					<FormField
						control={form.control}
						name="programId"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>{t("admissions.fields.program")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{programs.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="secondChoiceProgramId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.secondChoiceProgram")}{" "}
									<Opt label="opt." />
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{programs
											.filter((p) => p.id !== programId)
											.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="thirdChoiceProgramId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.thirdChoiceProgram")}{" "}
									<Opt label="opt." />
								</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value ?? ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="—" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{programs
											.filter(
												(p) =>
													p.id !== programId && p.id !== secondChoiceProgramId,
											)
											.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<FormField
				control={form.control}
				name="personalStatement"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("admissions.fields.personalStatement")} <Opt label="opt." />
						</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								rows={5}
								placeholder="Décrivez votre projet professionnel et vos motivations..."
								maxLength={3000}
							/>
						</FormControl>
						<p className="text-right text-muted-foreground text-xs">
							{personalStatement.length}/3000
						</p>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}

// ── Step 6 — Family & emergency ───────────────────────────────────────────────
function Step6({ form, t }: { form: AnyForm; t: (k: string) => string }) {
	return (
		<div className="space-y-6">
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Père
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="fatherName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.fatherName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherProfession"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.fatherProfession")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.fatherPhone")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fatherAlive"
						render={({ field }) => (
							<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="font-normal">
									{t("admissions.fields.fatherAlive")}
								</FormLabel>
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Mère
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="motherName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.motherName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherProfession"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.motherProfession")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("admissions.fields.motherPhone")} <Opt label="opt." />
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="motherAlive"
						render={({ field }) => (
							<FormItem className="flex items-center gap-2 space-y-0 self-end pb-1">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="font-normal">
									{t("admissions.fields.motherAlive")}
								</FormLabel>
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Tuteur légal <Opt label="opt." />
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="guardianName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianName")}</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guardianRelation"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianRelation")}</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Ex : Oncle, Frère aîné" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="guardianPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("admissions.fields.guardianPhone")}</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
			<div>
				<p className="mb-3 font-medium text-muted-foreground text-sm uppercase tracking-wide">
					Contact d'urgence
				</p>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="emergencyContactName"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactName")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emergencyContactPhone"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactPhone")}
								</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="emergencyContactCity"
						render={({ field }) => (
							<FormItem>
								<FormLabel required>
									{t("admissions.fields.emergencyContactCity")}
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</div>
	);
}

// ── Step 7 — Documents ────────────────────────────────────────────────────────
function Step7({ t }: { t: (k: string) => string }) {
	const docs = [
		{ key: "photo", required: true },
		{ key: "cni", required: true },
		{ key: "birthCert", required: true },
		{ key: "bacCert", required: true },
		{ key: "bacTranscript", required: true },
		{ key: "priorTranscript", required: false },
	] as const;

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-sm">
				{t("admissions.documents.subtitle")}
			</p>
			<div className="space-y-2">
				{docs.map((doc) => (
					<div
						key={doc.key}
						className="flex items-start gap-3 rounded-lg border p-3"
					>
						<div
							className={`mt-0.5 size-2 shrink-0 rounded-full ${doc.required ? "bg-destructive" : "bg-amber-400"}`}
						/>
						<p className="flex-1 text-sm">
							{t(`admissions.documents.items.${doc.key}`)}
						</p>
						<Badge
							variant={doc.required ? "outline" : "secondary"}
							className="shrink-0 text-xs"
						>
							{doc.required
								? t("admissions.documents.required")
								: t("admissions.documents.recommended")}
						</Badge>
					</div>
				))}
			</div>
			<div className="rounded-lg bg-muted/50 p-3 text-muted-foreground text-sm">
				💡 Ces pièces seront demandées lors du dépôt physique de votre dossier.
			</div>
		</div>
	);
}

// ── Step 8 — Recap & Submit ───────────────────────────────────────────────────
function Step8({
	form,
	t,
	programs,
	academicYears,
	goToStep,
	certify,
	setCertify,
	certifyError,
}: {
	form: AnyForm;
	t: (k: string) => string;
	programs: { id: string; name: string }[];
	academicYears: { id: string; name: string }[];
	goToStep: (n: number) => void;
	certify: boolean;
	setCertify: (v: boolean) => void;
	certifyError: boolean;
}) {
	const v = form.getValues();
	const noVal = t("admissions.wizard.noValue");
	const prog = (id?: string) =>
		programs.find((p) => p.id === id)?.name ?? noVal;
	const year = (id?: string) =>
		academicYears.find((y) => y.id === id)?.name ?? noVal;

	const sections = [
		{
			step: 1,
			title: t("admissions.recap.identity"),
			rows: [
				[t("admissions.fields.lastName"), v.lastName],
				[t("admissions.fields.firstName"), v.firstName],
				[
					t("admissions.fields.gender"),
					v.gender ? t(`admissions.options.gender.${v.gender}`) : "",
				],
				[t("admissions.fields.dateOfBirth"), v.dateOfBirth],
				[t("admissions.fields.placeOfBirth"), v.placeOfBirth],
				[t("admissions.fields.idCardNumber"), v.idCardNumber],
				[
					t("admissions.fields.maritalStatus"),
					v.maritalStatus
						? t(`admissions.options.maritalStatus.${v.maritalStatus}`)
						: "",
				],
			],
		},
		{
			step: 2,
			title: t("admissions.recap.contact"),
			rows: [
				[t("admissions.fields.email"), v.email],
				[t("admissions.fields.phone"), v.phone],
				[t("admissions.fields.nationality"), v.nationality],
				[
					t("admissions.fields.studentStatus"),
					v.studentStatus
						? t(`admissions.options.studentStatus.${v.studentStatus}`)
						: "",
				],
				[t("admissions.fields.originCountry"), v.originCountry],
				[t("admissions.fields.originRegion"), v.originRegion],
			],
		},
		{
			step: 3,
			title: t("admissions.recap.diploma"),
			rows: [
				[
					t("admissions.fields.entryDiplomaType"),
					v.entryDiplomaType
						? t(`admissions.options.diplomaType.${v.entryDiplomaType}`)
						: "",
				],
				[t("admissions.fields.bacSeries"), v.bacSeries],
				[t("admissions.fields.bacYear"), v.bacYear],
				[
					t("admissions.fields.bacMention"),
					v.bacMention
						? t(`admissions.options.bacMention.${v.bacMention}`)
						: "",
				],
				[t("admissions.fields.bacInstitution"), v.bacInstitution],
			],
		},
		{
			step: 4,
			title: t("admissions.recap.higherEd"),
			rows: v.hasPriorHigherEd
				? [
						[t("admissions.fields.priorInstitution"), v.priorInstitution],
						[t("admissions.fields.priorField"), v.priorField],
						[t("admissions.fields.priorLevel"), v.priorLevel],
					]
				: [[t("admissions.recap.noPriorHigherEd"), ""]],
		},
		{
			step: 5,
			title: t("admissions.recap.programs"),
			rows: [
				[t("admissions.fields.academicYear"), year(v.academicYearId)],
				[t("admissions.fields.academicLevel"), v.academicLevel],
				[t("admissions.fields.program"), prog(v.programId)],
				[
					t("admissions.fields.secondChoiceProgram"),
					prog(v.secondChoiceProgramId),
				],
			],
		},
		{
			step: 6,
			title: t("admissions.recap.family"),
			rows: [
				[t("admissions.fields.fatherName"), v.fatherName],
				[t("admissions.fields.motherName"), v.motherName],
				[t("admissions.fields.emergencyContactName"), v.emergencyContactName],
				[t("admissions.fields.emergencyContactPhone"), v.emergencyContactPhone],
			],
		},
	];

	return (
		<div className="space-y-4">
			{sections.map((sec) => (
				<div key={sec.step} className="overflow-hidden rounded-xl border">
					<div className="flex items-center justify-between bg-muted/40 px-4 py-2">
						<span className="font-medium text-sm">{sec.title}</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 gap-1 text-xs"
							onClick={() => goToStep(sec.step)}
						>
							{t("admissions.wizard.editStep")}
						</Button>
					</div>
					<div className="divide-y">
						{sec.rows.map(([label, value]) => (
							<div key={label} className="flex gap-3 px-4 py-2 text-sm">
								<span className="w-48 shrink-0 text-muted-foreground">
									{label}
								</span>
								<span
									className={
										value ? "font-medium" : "text-muted-foreground/50 italic"
									}
								>
									{value || noVal}
								</span>
							</div>
						))}
					</div>
				</div>
			))}
			<div
				className={`mt-6 rounded-xl border-2 p-4 transition-colors ${certifyError ? "border-destructive bg-destructive/5" : "border-primary/20 bg-primary/5"}`}
			>
				<label className="flex cursor-pointer items-start gap-3">
					<Checkbox
						checked={certify}
						onCheckedChange={(v) => setCertify(!!v)}
						className="mt-0.5"
					/>
					<span className="text-sm leading-relaxed">
						{t("admissions.wizard.certify")}
					</span>
				</label>
				{certifyError && (
					<p className="mt-2 text-destructive text-xs">
						{t("admissions.wizard.certifyRequired")}
					</p>
				)}
			</div>
		</div>
	);
}
