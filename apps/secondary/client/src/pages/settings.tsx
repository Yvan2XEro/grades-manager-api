import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/utils/trpc";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schoolProfileSchema = z.object({
	name: z.string().min(1, "Required"),
	minesecCode: z.string().max(50).optional(),
	region: z.string().max(100).optional(),
	schoolType: z.enum(["public", "private", "confessional"]).optional(),
	address: z.string().optional(),
	phone: z.string().max(30).optional(),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
});

const academicConfigSchema = z.object({
	assessmentMode: z.enum(["sequences", "composition"]),
});

type SchoolProfileValues = z.infer<typeof schoolProfileSchema>;
type AcademicConfigValues = z.infer<typeof academicConfigSchema>;

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<div className="border-border border-b bg-muted/30 px-5 py-4">
				<h2 className="font-semibold text-foreground text-sm">{title}</h2>
				{description && (
					<p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
				)}
			</div>
			<div className="px-5 py-4">{children}</div>
		</div>
	);
}

function ComingSoonSave({ label }: { label: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-block">
					<Button type="button" disabled>
						{label}
					</Button>
				</span>
			</TooltipTrigger>
			<TooltipContent>Coming soon</TooltipContent>
		</Tooltip>
	);
}

// ─── School Profile form ──────────────────────────────────────────────────────

function SchoolProfileForm() {
	const { t } = useTranslation();

	// NOTE: No institution.update procedure exists yet. The form renders
	// with empty defaults; the Save button is disabled with "Coming soon".
	const {
		register,
		formState: { errors },
	} = useForm<SchoolProfileValues>({
		resolver: zodResolver(schoolProfileSchema),
		defaultValues: {
			name: "",
			minesecCode: "",
			region: "",
			address: "",
			phone: "",
			email: "",
		},
	});

	return (
		<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<FormField
					label={t("settings.school_name", "School name")}
					error={errors.name?.message}
					required
				>
					<Input placeholder="e.g. Lycée de Yaoundé" {...register("name")} />
				</FormField>

				<FormField
					label={t("settings.minesec_code", "MINESEC code")}
					error={errors.minesecCode?.message}
				>
					<Input placeholder="e.g. LYA-001" {...register("minesecCode")} />
				</FormField>

				<FormField
					label={t("settings.region", "Region / Division")}
					error={errors.region?.message}
				>
					<Input placeholder="e.g. Centre, Mfoundi" {...register("region")} />
				</FormField>

				<FormField
					label={t("settings.school_type", "School type")}
					error={errors.schoolType?.message}
				>
					<Select {...register("schoolType")}>
						<SelectOption value="">— Select —</SelectOption>
						<SelectOption value="public">
							{t("settings.type_public", "Public")}
						</SelectOption>
						<SelectOption value="private">
							{t("settings.type_private", "Private")}
						</SelectOption>
						<SelectOption value="confessional">
							{t("settings.type_confessional", "Confessional")}
						</SelectOption>
					</Select>
				</FormField>

				<FormField
					label={t("settings.phone", "Phone")}
					error={errors.phone?.message}
				>
					<Input
						type="tel"
						placeholder="+237 6XX XXX XXX"
						{...register("phone")}
					/>
				</FormField>

				<FormField
					label={t("settings.email", "Email")}
					error={errors.email?.message}
				>
					<Input
						type="email"
						placeholder="school@example.cm"
						{...register("email")}
					/>
				</FormField>
			</div>

			<FormField
				label={t("settings.address", "Address")}
				error={errors.address?.message}
			>
				<textarea
					rows={3}
					placeholder="Street address, city…"
					className="flex min-h-[72px] w-full rounded-md border border-input bg-input px-3 py-2 text-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/55 focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
					{...register("address")}
				/>
			</FormField>

			<div className="pt-1">
				<ComingSoonSave label={t("settings.save_profile", "Save Profile")} />
			</div>
		</form>
	);
}

// ─── Academic config form ─────────────────────────────────────────────────────

function AcademicConfigForm() {
	const { t } = useTranslation();

	// NOTE: No institution.update procedure exists yet.
	const { register } = useForm<AcademicConfigValues>({
		resolver: zodResolver(academicConfigSchema),
		defaultValues: { assessmentMode: "sequences" },
	});

	return (
		<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
			<FormField label={t("settings.assessment_mode", "Assessment mode")}>
				<Select {...register("assessmentMode")}>
					<SelectOption value="sequences">
						{t(
							"settings.mode_sequences",
							"Sequences — 6 sequences per trimester (3 terms × 2 sequences)",
						)}
					</SelectOption>
					<SelectOption value="composition">
						{t(
							"settings.mode_composition",
							"Composition — Written exam per trimester",
						)}
					</SelectOption>
				</Select>
			</FormField>

			<div className="space-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-xs">
				<p>
					<strong className="text-foreground">Sequences:</strong>{" "}
					{t(
						"settings.mode_sequences_desc",
						"Each trimester has 2 sequences (6 total). The trimester average is the mean of the two sequence grades.",
					)}
				</p>
				<p>
					<strong className="text-foreground">Composition:</strong>{" "}
					{t(
						"settings.mode_composition_desc",
						"Each trimester has one composition exam. The grade entered is the term average directly.",
					)}
				</p>
			</div>

			<div className="pt-1">
				<ComingSoonSave
					label={t("settings.save_config", "Save Configuration")}
				/>
			</div>
		</form>
	);
}

// ─── Main settings page ───────────────────────────────────────────────────────

export function Settings() {
	const { t, i18n } = useTranslation();

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");

	const handleLanguageChange = (lang: string) => {
		i18n.changeLanguage(lang);
		localStorage.setItem("i18n_lang", lang);
	};

	return (
		<div className="max-w-2xl space-y-6">
			{/* Page header */}
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("settings.title", "Settings")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t(
						"settings.subtitle",
						"Configure your school and application preferences",
					)}
				</p>
			</div>

			{/* Language */}
			<SectionCard title={t("settings.language", "Interface language")}>
				<div className="flex gap-2">
					{(["fr", "en"] as const).map((lang) => (
						<button
							key={lang}
							type="button"
							onClick={() => handleLanguageChange(lang)}
							className={`rounded-lg border px-4 py-1.5 font-medium text-sm transition-colors ${
								i18n.language === lang
									? "border-primary bg-primary text-primary-foreground"
									: "border-input bg-background text-foreground hover:bg-muted"
							}`}
						>
							{lang === "fr" ? "Français" : "English"}
						</button>
					))}
				</div>
			</SectionCard>

			<Separator />

			{/* School profile */}
			<SectionCard
				title={t("settings.school_profile", "School Profile")}
				description={t(
					"settings.school_profile_desc",
					"Basic information about your institution",
				)}
			>
				<SchoolProfileForm />
			</SectionCard>

			{/* Academic configuration */}
			<SectionCard
				title={t("settings.academic_config", "Academic Configuration")}
				description={t(
					"settings.academic_config_desc",
					"Assessment model used for grade calculation",
				)}
			>
				<AcademicConfigForm />
			</SectionCard>

			<Separator />

			{/* About */}
			<SectionCard title={t("settings.about", "About")}>
				<dl className="space-y-3 text-sm">
					<div className="flex items-baseline justify-between gap-4">
						<dt className="text-muted-foreground">
							{t("settings.active_year", "Active academic year")}
						</dt>
						<dd className="font-medium text-foreground">
							{activeYear?.name ?? t("settings.no_active_year", "None")}
						</dd>
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<dt className="text-muted-foreground">
							{t("settings.app_version", "App version")}
						</dt>
						<dd className="font-medium text-foreground">
							TKAMS Secondary 1.0.0
						</dd>
					</div>
				</dl>
			</SectionCard>
		</div>
	);
}
