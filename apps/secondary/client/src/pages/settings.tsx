import { zodResolver } from "@hookform/resolvers/zod";
import {
	Building2,
	Camera,
	CheckCircle2,
	Copy,
	Loader2,
	Rocket,
	ShieldCheck,
	ShieldOff,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient, useSession } from "@/lib/auth-client";
import { TermsContent } from "@/pages/terms/terms-list";
import { trpc } from "@/utils/trpc";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schoolProfileSchema = z.object({
	name: z.string().min(1, "Required"),
	minesecCode: z.string().max(50).optional(),
	city: z.string().max(100).optional(),
	type: z.enum(["lycee", "college", "mixed"]).optional(),
	address: z.string().optional(),
	phone: z.string().max(30).optional(),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
});

const academicConfigSchema = z.object({
	assessmentMode: z.enum(["six_sequence", "composition"]),
});

const profileSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SchoolProfileValues = z.infer<typeof schoolProfileSchema>;
type AcademicConfigValues = z.infer<typeof academicConfigSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function uploadFile(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await fetch(
		`${import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001"}/api/upload`,
		{ method: "POST", body: fd, credentials: "include" },
	);
	if (!res.ok) throw new Error("Upload failed");
	const json = (await res.json()) as { url: string };
	return json.url;
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
	const { t } = useTranslation();
	const { data: session, refetch } = useSession();
	const user = session?.user;

	// Avatar upload
	const fileRef = useRef<HTMLInputElement>(null);
	const [avatarLoading, setAvatarLoading] = useState(false);
	const [avatarError, setAvatarError] = useState("");

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarError("");
		setAvatarLoading(true);
		try {
			const url = await uploadFile(file);
			await authClient.updateUser({ image: url });
			await refetch();
		} catch {
			setAvatarError("Upload failed. Try again.");
		} finally {
			setAvatarLoading(false);
			e.target.value = "";
		}
	};

	// Name form
	const [profileSuccess, setProfileSuccess] = useState(false);
	const [profileError, setProfileError] = useState("");
	const {
		register: regProfile,
		handleSubmit: handleProfile,
		formState: { errors: profileErrors, isSubmitting: profileSubmitting },
	} = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		values: { name: user?.name ?? "" },
	});

	const onSaveProfile = async (data: ProfileValues) => {
		setProfileError("");
		setProfileSuccess(false);
		const res = await authClient.updateUser({ name: data.name });
		if (res.error) {
			setProfileError(res.error.message ?? "Error saving profile");
		} else {
			await refetch();
			setProfileSuccess(true);
		}
	};

	// Change password form
	const [pwSuccess, setPwSuccess] = useState(false);
	const [pwError, setPwError] = useState("");
	const {
		register: regPw,
		handleSubmit: handlePw,
		reset: resetPw,
		formState: { errors: pwErrors, isSubmitting: pwSubmitting },
	} = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
	});

	const onChangePassword = async (data: ChangePasswordValues) => {
		setPwError("");
		setPwSuccess(false);
		const res = await authClient.changePassword({
			currentPassword: data.currentPassword,
			newPassword: data.newPassword,
			revokeOtherSessions: false,
		});
		if (res.error) {
			setPwError(res.error.message ?? "Error changing password");
		} else {
			resetPw();
			setPwSuccess(true);
		}
	};

	const image = (user as { image?: string | null } | undefined)?.image;

	return (
		<div className="space-y-5">
			{/* Personal info */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-5 py-4">
					<h2 className="font-semibold text-foreground text-sm">
						{t("settings.personal_info", "Personal information")}
					</h2>
				</div>
				<div className="space-y-5 px-5 py-4">
					{/* Avatar */}
					<div className="flex items-center gap-4">
						<div className="relative">
							<div
								className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10"
								onClick={() => fileRef.current?.click()}
							>
								{avatarLoading ? (
									<Loader2 className="h-6 w-6 animate-spin text-primary" />
								) : image ? (
									<img
										src={image}
										alt="Avatar"
										className="h-full w-full object-cover"
									/>
								) : (
									<span className="font-semibold text-primary text-xl">
										{getInitials(user?.name)}
									</span>
								)}
							</div>
							<button
								type="button"
								className="-bottom-1 -right-1 absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow"
								onClick={() => fileRef.current?.click()}
							>
								<Camera className="h-3 w-3" />
							</button>
						</div>
						<div>
							<p className="font-medium text-foreground text-sm">
								{t("settings.profile_photo", "Profile photo")}
							</p>
							<p className="text-muted-foreground text-xs">
								{t("settings.profile_photo_hint", "PNG or JPG, max 10 MB")}
							</p>
							{avatarError && (
								<p className="mt-0.5 text-destructive text-xs">{avatarError}</p>
							)}
						</div>
						<input
							ref={fileRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleAvatarChange}
						/>
					</div>

					{/* Name + email form */}
					<form className="space-y-4" onSubmit={handleProfile(onSaveProfile)}>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								label={t("settings.full_name", "Full name")}
								error={profileErrors.name?.message}
								required
							>
								<Input {...regProfile("name")} placeholder="Your name" />
							</FormField>
							<FormField label={t("settings.email_address", "Email address")}>
								<Input
									value={user?.email ?? ""}
									disabled
									className="text-muted-foreground"
								/>
							</FormField>
						</div>

						{profileError && (
							<p className="text-destructive text-sm">{profileError}</p>
						)}
						{profileSuccess && (
							<p className="text-emerald-600 text-sm">
								{t("settings.profile_saved", "Profile saved.")}
							</p>
						)}

						<Button type="submit" disabled={profileSubmitting}>
							{profileSubmitting
								? t("common.saving", "Saving…")
								: t("settings.save_profile", "Save Profile")}
						</Button>
					</form>
				</div>
			</div>

			{/* Change password */}
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="border-border border-b bg-muted/30 px-5 py-4">
					<h2 className="font-semibold text-foreground text-sm">
						{t("settings.change_password", "Change password")}
					</h2>
				</div>
				<div className="px-5 py-4">
					<form className="space-y-4" onSubmit={handlePw(onChangePassword)}>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								label={t("settings.current_password", "Current password")}
								error={pwErrors.currentPassword?.message}
								required
							>
								<Input
									type="password"
									{...regPw("currentPassword")}
									autoComplete="current-password"
								/>
							</FormField>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								label={t("settings.new_password", "New password")}
								error={pwErrors.newPassword?.message}
								required
							>
								<Input
									type="password"
									{...regPw("newPassword")}
									autoComplete="new-password"
								/>
							</FormField>
							<FormField
								label={t("settings.confirm_password", "Confirm new password")}
								error={pwErrors.confirmPassword?.message}
								required
							>
								<Input
									type="password"
									{...regPw("confirmPassword")}
									autoComplete="new-password"
								/>
							</FormField>
						</div>

						{pwError && <p className="text-destructive text-sm">{pwError}</p>}
						{pwSuccess && (
							<p className="text-emerald-600 text-sm">
								{t(
									"settings.password_changed",
									"Password changed successfully.",
								)}
							</p>
						)}

						<Button type="submit" disabled={pwSubmitting}>
							{pwSubmitting
								? t("common.saving", "Saving…")
								: t("settings.change_password_btn", "Change password")}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}

// ─── School Profile form ──────────────────────────────────────────────────────

function SchoolProfileForm() {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: institution } = trpc.institutions.get.useQuery();
	const update = trpc.institutions.update.useMutation({
		onSuccess: () => utils.institutions.get.invalidate(),
	});

	// Logo upload
	const logoRef = useRef<HTMLInputElement>(null);
	const [logoLoading, setLogoLoading] = useState(false);
	const [logoError, setLogoError] = useState("");

	const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setLogoError("");
		setLogoLoading(true);
		try {
			const url = await uploadFile(file);
			update.mutate({ logoUrl: url });
		} catch {
			setLogoError("Upload failed. Try again.");
		} finally {
			setLogoLoading(false);
			e.target.value = "";
		}
	};

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<SchoolProfileValues>({
		resolver: zodResolver(schoolProfileSchema),
		values: institution
			? {
					name: institution.name,
					minesecCode: institution.minesecCode ?? "",
					city: institution.city ?? "",
					type: (institution.type as SchoolProfileValues["type"]) ?? undefined,
					address: institution.address ?? "",
					phone: institution.phone ?? "",
					email: institution.email ?? "",
				}
			: undefined,
	});

	const onSubmit = (data: SchoolProfileValues) => {
		update.mutate({
			name: data.name,
			minesecCode: data.minesecCode || undefined,
			city: data.city || undefined,
			type: data.type,
			address: data.address || undefined,
			phone: data.phone || undefined,
			email: data.email || undefined,
		});
	};

	const logoUrl = (institution as { logoUrl?: string | null } | undefined)
		?.logoUrl;

	return (
		<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
			{/* Logo upload */}
			<div className="flex items-center gap-4">
				<div
					className="relative flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
					onClick={() => logoRef.current?.click()}
				>
					{logoLoading ? (
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					) : logoUrl ? (
						<img
							src={logoUrl}
							alt="Logo"
							className="h-full w-full object-contain p-1"
						/>
					) : (
						<Building2 className="h-8 w-8 text-muted-foreground/40" />
					)}
					<div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-colors hover:bg-black/20">
						<Camera className="h-5 w-5 text-white opacity-0 transition-opacity hover:opacity-100" />
					</div>
				</div>
				<div>
					<p className="font-medium text-foreground text-sm">
						{t("settings.school_logo", "School logo")}
					</p>
					<p className="text-muted-foreground text-xs">
						{t("settings.logo_hint", "PNG or JPG, recommended 256×256 px")}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-2 h-7 text-xs"
						onClick={() => logoRef.current?.click()}
						disabled={logoLoading}
					>
						{logoLoading ? (
							<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
						) : (
							<Camera className="mr-1.5 h-3 w-3" />
						)}
						{logoUrl
							? t("settings.change_logo", "Change logo")
							: t("settings.upload_logo", "Upload logo")}
					</Button>
					{logoError && (
						<p className="mt-1 text-destructive text-xs">{logoError}</p>
					)}
				</div>
				<input
					ref={logoRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleLogoChange}
				/>
			</div>

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
					label={t("settings.city", "City / Division")}
					error={errors.city?.message}
				>
					<Input placeholder="e.g. Yaoundé, Mfoundi" {...register("city")} />
				</FormField>

				<FormField
					label={t("settings.school_type", "School type")}
					error={errors.type?.message}
				>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<Select
								value={field.value ?? ""}
								onValueChange={(val) =>
									field.onChange(
										val === ""
											? undefined
											: (val as SchoolProfileValues["type"]),
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("common.select", "Select…")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="lycee">
										{t("settings.type_lycee", "Lycée")}
									</SelectItem>
									<SelectItem value="college">
										{t("settings.type_college", "Collège")}
									</SelectItem>
									<SelectItem value="mixed">
										{t("settings.type_mixed", "Mixed (Lycée + Collège)")}
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</FormField>

				<FormField
					label={t("settings.phone", "Phone")}
					error={errors.phone?.message}
				>
					<Controller
						name="phone"
						control={control}
						render={({ field }) => (
							<PhoneInput
								defaultCountry="CM"
								value={field.value ?? ""}
								onChange={field.onChange}
							/>
						)}
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
					placeholder="Street address…"
					className="flex min-h-[72px] w-full rounded-md border border-input bg-input px-3 py-2 text-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/55 focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
					{...register("address")}
				/>
			</FormField>

			<div className="pt-1">
				<Button type="submit" disabled={isSubmitting || update.isPending}>
					{update.isPending
						? t("common.saving", "Saving…")
						: t("settings.save_profile", "Save Profile")}
				</Button>
			</div>
		</form>
	);
}

// ─── Academic config form ─────────────────────────────────────────────────────

function AcademicConfigForm() {
	const { t } = useTranslation();
	const utils = trpc.useUtils();

	const { data: institution } = trpc.institutions.get.useQuery();
	const update = trpc.institutions.update.useMutation({
		onSuccess: () => utils.institutions.get.invalidate(),
	});

	const {
		handleSubmit,
		control,
		formState: { isSubmitting },
	} = useForm<AcademicConfigValues>({
		resolver: zodResolver(academicConfigSchema),
		values: institution
			? {
					assessmentMode:
						(institution.assessmentMode as AcademicConfigValues["assessmentMode"]) ??
						"six_sequence",
				}
			: undefined,
	});

	const onSubmit = (data: AcademicConfigValues) => {
		update.mutate({ assessmentMode: data.assessmentMode });
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<FormField label={t("settings.assessment_mode", "Assessment mode")}>
				<Controller
					name="assessmentMode"
					control={control}
					render={({ field }) => (
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="six_sequence">
									{t(
										"settings.mode_sequences",
										"Sequences — 6 sequences per trimester",
									)}
								</SelectItem>
								<SelectItem value="composition">
									{t(
										"settings.mode_composition",
										"Composition — Written exam per trimester",
									)}
								</SelectItem>
							</SelectContent>
						</Select>
					)}
				/>
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
				<Button type="submit" disabled={isSubmitting || update.isPending}>
					{update.isPending
						? t("common.saving", "Saving…")
						: t("settings.save_config", "Save Configuration")}
				</Button>
			</div>
		</form>
	);
}

// ─── Two-Factor Authentication section ───────────────────────────────────────

type TwoFAStep = "idle" | "setup" | "verify" | "done";

function TwoFactorSection() {
	const { t } = useTranslation();
	const { data: session, isPending } = useSession();
	const [step, setStep] = useState<TwoFAStep>("idle");
	const [password, setPassword] = useState("");
	const [totpUri, setTotpUri] = useState("");
	const [qrDataUrl, setQrDataUrl] = useState("");
	const [totpCode, setTotpCode] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [disableCode, setDisableCode] = useState("");
	const [showDisable, setShowDisable] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		if (!totpUri) return;
		QRCode.toDataURL(totpUri, { width: 200, margin: 1 })
			.then(setQrDataUrl)
			.catch(() => setQrDataUrl(""));
	}, [totpUri]);

	const isEnabled = !!(session?.user as { twoFactorEnabled?: boolean })
		?.twoFactorEnabled;

	const handleStartSetup = async () => {
		if (!password) {
			setError(t("settings.2fa_enter_password", "Enter your password"));
			return;
		}
		setError("");
		setLoading(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (authClient.twoFactor.enable as any)({ password });
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		setTotpUri((res.data as { totpURI: string }).totpURI);
		setBackupCodes((res.data as { backupCodes?: string[] }).backupCodes ?? []);
		setStep("verify");
	};

	const handleEnable = async () => {
		if (!totpCode || totpCode.length !== 6) {
			setError(t("settings.2fa_enter_code", "Enter the 6-digit code"));
			return;
		}
		setError("");
		setLoading(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await (authClient.twoFactor.verifyTotp as any)({
			code: totpCode,
		});
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		setPassword("");
		setTotpCode("");
		setStep("done");
	};

	const handleDisable = async () => {
		if (!disableCode) {
			setError(t("settings.2fa_enter_password", "Enter your password"));
			return;
		}
		setError("");
		setLoading(true);
		const res = await authClient.twoFactor.disable({ password: disableCode });
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "Error");
			return;
		}
		setShowDisable(false);
		setDisableCode("");
	};

	if (isPending) return null;

	if (step === "done") {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
					<CheckCircle2 className="size-5" />
					<span className="font-medium text-sm">
						{t(
							"settings.2fa_enabled_success",
							"Two-factor authentication enabled!",
						)}
					</span>
				</div>
				{backupCodes.length > 0 && (
					<div className="space-y-2">
						<p className="font-medium text-foreground text-sm">
							{t("settings.2fa_backup_codes", "Backup codes")}
						</p>
						<p className="text-muted-foreground text-xs">
							{t(
								"settings.2fa_backup_codes_desc",
								"Save these codes in a safe place. Each can be used once if you lose access to your authenticator.",
							)}
						</p>
						<div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
							{backupCodes.map((code) => (
								<span key={code} className="text-foreground">
									{code}
								</span>
							))}
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								navigator.clipboard.writeText(backupCodes.join("\n"))
							}
						>
							<Copy className="mr-1.5 size-3.5" />
							{t("settings.2fa_copy_codes", "Copy codes")}
						</Button>
					</div>
				)}
				<Button type="button" onClick={() => setStep("idle")}>
					{t("common.done", "Done")}
				</Button>
			</div>
		);
	}

	if (isEnabled) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
					<ShieldCheck className="size-5" />
					<span className="font-medium text-sm">
						{t("settings.2fa_active", "Two-factor authentication is active")}
					</span>
				</div>
				{!showDisable ? (
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setShowDisable(true);
							setError("");
						}}
					>
						<ShieldOff className="mr-1.5 size-4" />
						{t("settings.2fa_disable", "Disable 2FA")}
					</Button>
				) : (
					<div className="space-y-3">
						<p className="text-muted-foreground text-sm">
							{t(
								"settings.2fa_enter_password_to_disable",
								"Enter your current password to disable 2FA.",
							)}
						</p>
						<FormField
							label={t("settings.current_password", "Current password")}
							error={error}
						>
							<Input
								type="password"
								value={disableCode}
								onChange={(e) => setDisableCode(e.target.value)}
								autoFocus
							/>
						</FormField>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="destructive"
								disabled={loading}
								onClick={handleDisable}
							>
								{loading
									? t("common.loading", "Loading…")
									: t("settings.2fa_confirm_disable", "Confirm disable")}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowDisable(false);
									setError("");
									setDisableCode("");
								}}
							>
								{t("common.cancel", "Cancel")}
							</Button>
						</div>
					</div>
				)}
			</div>
		);
	}

	if (step === "idle") {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-muted-foreground">
					<ShieldOff className="size-5" />
					<span className="text-sm">
						{t(
							"settings.2fa_disabled",
							"Two-factor authentication is not enabled",
						)}
					</span>
				</div>
				<Button
					type="button"
					onClick={() => {
						setStep("setup");
						setError("");
					}}
				>
					<ShieldCheck className="mr-1.5 size-4" />
					{t("settings.2fa_enable", "Enable 2FA")}
				</Button>
			</div>
		);
	}

	if (step === "setup") {
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">
					{t(
						"settings.2fa_setup_desc",
						"Enter your current password to generate a QR code for your authenticator app.",
					)}
				</p>
				<FormField
					label={t("settings.current_password", "Current password")}
					error={error}
				>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleStartSetup()}
						autoFocus
					/>
				</FormField>
				<div className="flex gap-2">
					<Button type="button" disabled={loading} onClick={handleStartSetup}>
						{loading
							? t("common.loading", "Loading…")
							: t("common.continue", "Continue")}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setStep("idle");
							setError("");
							setPassword("");
						}}
					>
						{t("common.cancel", "Cancel")}
					</Button>
				</div>
			</div>
		);
	}

	// step === "verify"
	return (
		<div className="space-y-4">
			<p className="font-medium text-foreground text-sm">
				{t(
					"settings.2fa_scan_qr",
					"Scan this QR code with your authenticator app",
				)}
			</p>
			{qrDataUrl ? (
				<img
					src={qrDataUrl}
					alt="TOTP QR Code"
					className="size-48 rounded border border-border"
				/>
			) : (
				<div className="size-48 animate-pulse rounded border border-border bg-muted" />
			)}
			<p className="text-muted-foreground text-xs">
				{t("settings.2fa_or_enter_manually", "Or enter this key manually:")}
			</p>
			<code className="block select-all break-all rounded bg-muted px-2 py-1 text-xs">
				{totpUri}
			</code>
			<FormField
				label={t("settings.2fa_totp_code", "6-digit code from your app")}
				error={error}
			>
				<Input
					value={totpCode}
					onChange={(e) =>
						setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
					}
					placeholder="000000"
					maxLength={6}
					className="w-36 font-mono"
					onKeyDown={(e) => e.key === "Enter" && handleEnable()}
					autoFocus
				/>
			</FormField>
			<div className="flex gap-2">
				<Button type="button" disabled={loading} onClick={handleEnable}>
					{loading
						? t("common.loading", "Loading…")
						: t("settings.2fa_verify_enable", "Verify & Enable")}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setStep("idle");
						setTotpUri("");
						setTotpCode("");
						setError("");
						setPassword("");
					}}
				>
					{t("common.cancel", "Cancel")}
				</Button>
			</div>
		</div>
	);
}

// ─── Main settings page ───────────────────────────────────────────────────────

export function Settings() {
	const { t, i18n } = useTranslation();

	const { data: academicYears = [] } = trpc.academicYears.list.useQuery();
	const activeYear = academicYears.find((y) => y.status === "active");
	const { data: myRole } = trpc.institutions.myRole.useQuery();
	const isAdmin = myRole?.isAdmin ?? false;

	const handleLanguageChange = (lang: string) => {
		i18n.changeLanguage(lang);
		localStorage.setItem("i18n_lang", lang);
	};

	return (
		<div className="max-w-2xl space-y-5">
			<div className="flex items-start justify-between">
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
				{isAdmin && (
					<Button variant="outline" size="sm" asChild>
						<Link to="/onboarding">
							<Rocket className="mr-1.5 h-3.5 w-3.5" />
							{t("onboarding.setup_wizard", "Setup wizard")}
						</Link>
					</Button>
				)}
			</div>

			<Tabs defaultValue="profile">
				<TabsList className="mb-4">
					<TabsTrigger value="profile">
						{t("settings.tab_profile", "Profile")}
					</TabsTrigger>
					{isAdmin && (
						<TabsTrigger value="school">
							{t("settings.tab_school", "School")}
						</TabsTrigger>
					)}
					{isAdmin && (
						<TabsTrigger value="academic">
							{t("settings.tab_academic", "Academic")}
						</TabsTrigger>
					)}
					{isAdmin && (
						<TabsTrigger value="terms">
							{t("settings.tab_terms", "Terms")}
						</TabsTrigger>
					)}
					<TabsTrigger value="preferences">
						{t("settings.tab_preferences", "Preferences")}
					</TabsTrigger>
					<TabsTrigger value="security">
						{t("settings.tab_security", "Security")}
					</TabsTrigger>
					<TabsTrigger value="about">
						{t("settings.tab_about", "About")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="mt-0">
					<ProfileTab />
				</TabsContent>

				{isAdmin && (
					<TabsContent value="school" className="mt-0">
						<div className="overflow-hidden rounded-xl border border-border">
							<div className="border-border border-b bg-muted/30 px-5 py-4">
								<h2 className="font-semibold text-foreground text-sm">
									{t("settings.school_profile", "School Profile")}
								</h2>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{t(
										"settings.school_profile_desc",
										"Basic information about your institution",
									)}
								</p>
							</div>
							<div className="px-5 py-4">
								<SchoolProfileForm />
							</div>
						</div>
					</TabsContent>
				)}

				{isAdmin && (
					<TabsContent value="academic" className="mt-0">
						<div className="overflow-hidden rounded-xl border border-border">
							<div className="border-border border-b bg-muted/30 px-5 py-4">
								<h2 className="font-semibold text-foreground text-sm">
									{t("settings.academic_config", "Academic Configuration")}
								</h2>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{t(
										"settings.academic_config_desc",
										"Assessment model used for grade calculation",
									)}
								</p>
							</div>
							<div className="px-5 py-4">
								<AcademicConfigForm />
							</div>
						</div>
					</TabsContent>
				)}

				{isAdmin && (
					<TabsContent value="terms" className="mt-0">
						<div className="overflow-hidden rounded-xl border border-border">
							<div className="border-border border-b bg-muted/30 px-5 py-4">
								<h2 className="font-semibold text-foreground text-sm">
									{t("terms.title", "Terms")}
								</h2>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{t(
										"terms.settings_desc",
										"Open a term to allow grade entry. Close it to lock the period.",
									)}
								</p>
							</div>
							<div className="px-5 py-5">
								<TermsContent />
							</div>
						</div>
					</TabsContent>
				)}

				<TabsContent value="preferences" className="mt-0">
					<div className="overflow-hidden rounded-xl border border-border">
						<div className="border-border border-b bg-muted/30 px-5 py-4">
							<h2 className="font-semibold text-foreground text-sm">
								{t("settings.language", "Interface language")}
							</h2>
						</div>
						<div className="px-5 py-4">
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
						</div>
					</div>
				</TabsContent>

				<TabsContent value="security" className="mt-0">
					<div className="overflow-hidden rounded-xl border border-border">
						<div className="border-border border-b bg-muted/30 px-5 py-4">
							<h2 className="font-semibold text-foreground text-sm">
								{t("settings.security_title", "Two-Factor Authentication")}
							</h2>
							<p className="mt-0.5 text-muted-foreground text-xs">
								{t(
									"settings.security_desc",
									"Add an extra layer of security to your account using an authenticator app (e.g. Google Authenticator, Authy).",
								)}
							</p>
						</div>
						<div className="px-5 py-4">
							<TwoFactorSection />
						</div>
					</div>
				</TabsContent>

				<TabsContent value="about" className="mt-0">
					<div className="overflow-hidden rounded-xl border border-border">
						<div className="border-border border-b bg-muted/30 px-5 py-4">
							<h2 className="font-semibold text-foreground text-sm">
								{t("settings.about", "About")}
							</h2>
						</div>
						<div className="px-5 py-4">
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
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
