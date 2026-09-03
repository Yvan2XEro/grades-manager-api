import {
	CheckCircle2,
	Copy,
	ImagePlus,
	KeyRound,
	Loader2,
	ShieldCheck,
	ShieldOff,
	User,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "@/contexts/breadcrumbs-context";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function uploadFile(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("file", file);
	const res = await fetch("/api/upload", {
		method: "POST",
		body: fd,
		credentials: "include",
	});
	if (!res.ok) throw new Error("Upload failed");
	const json = await res.json();
	return json.url as string;
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

export function SysAdminProfileTab() {
	const { t } = useTranslation();
	const { data: session } = useSession();
	const user = session?.user;

	const [name, setName] = useState(user?.name ?? "");
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [nameSaving, setNameSaving] = useState(false);
	const [nameMsg, setNameMsg] = useState("");

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		flushSync(() => setAvatarUploading(true));
		try {
			const url = await uploadFile(file);
			await authClient.updateUser({ image: url });
		} catch {
			// silently fail
		} finally {
			setAvatarUploading(false);
		}
	};

	const handleNameSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setNameSaving(true);
		setNameMsg("");
		try {
			await authClient.updateUser({ name: name.trim() });
			setNameMsg(t("sysadmin.settings.name_updated", "Name updated."));
		} catch {
			setNameMsg(
				t("sysadmin.settings.name_update_failed", "Failed to update name."),
			);
		} finally {
			setNameSaving(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Avatar */}
			<div>
				<h3 className="mb-4 font-semibold text-foreground">
					{t("sysadmin.settings.avatar", "Avatar")}
				</h3>
				<div className="flex items-center gap-4">
					{user?.image ? (
						<img
							src={user.image}
							alt=""
							className="h-16 w-16 rounded-full border-2 border-border object-cover"
						/>
					) : (
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xl">
							{getInitials(user?.name)}
						</div>
					)}
					<label
						className={`flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-foreground text-sm transition-colors hover:bg-muted/50 ${avatarUploading ? "pointer-events-none opacity-60" : ""}`}
					>
						{avatarUploading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ImagePlus className="h-4 w-4" />
						)}
						{avatarUploading
							? t("common.loading", "Loading…")
							: t("sysadmin.settings.change_avatar", "Change avatar")}
						<input
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={handleAvatarChange}
							disabled={avatarUploading}
						/>
					</label>
				</div>
			</div>

			{/* Name */}
			<form onSubmit={handleNameSave} className="max-w-sm space-y-3">
				<h3 className="font-semibold text-foreground">
					{t("sysadmin.settings.display_name", "Display name")}
				</h3>
				<div className="space-y-1.5">
					<Label htmlFor="admin-name">{t("common.name", "Name")}</Label>
					<Input
						id="admin-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("sysadmin.settings.name_placeholder", "Your name")}
					/>
				</div>
				<div className="space-y-1.5">
					<Label>{t("settings.email_address", "Email address")}</Label>
					<Input value={user?.email ?? ""} disabled className="opacity-60" />
					<p className="text-muted-foreground text-xs">
						{t(
							"sysadmin.settings.email_readonly",
							"Email cannot be changed here.",
						)}
					</p>
				</div>
				{nameMsg && <p className="text-muted-foreground text-sm">{nameMsg}</p>}
				<Button type="submit" disabled={nameSaving || !name.trim()}>
					{nameSaving
						? t("common.saving", "Saving…")
						: t("settings.save_profile", "Save Profile")}
				</Button>
			</form>
		</div>
	);
}

// ─── Two-factor section ───────────────────────────────────────────────────────

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
					<CheckCircle2 className="h-5 w-5" />
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
							<Copy className="mr-1.5 h-3.5 w-3.5" />
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
					<ShieldCheck className="h-5 w-5" />
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
						<ShieldOff className="mr-1.5 h-4 w-4" />
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
						<div className="space-y-1.5">
							<Label htmlFor="disable-2fa-pwd">
								{t("settings.current_password", "Current password")}
							</Label>
							<Input
								id="disable-2fa-pwd"
								type="password"
								value={disableCode}
								onChange={(e) => setDisableCode(e.target.value)}
								autoFocus
							/>
							{error && (
								<p className="mt-1 text-destructive text-xs">{error}</p>
							)}
						</div>
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
					<ShieldOff className="h-5 w-5" />
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
					<ShieldCheck className="mr-1.5 h-4 w-4" />
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
				<div className="space-y-1.5">
					<Label htmlFor="enable-2fa-pwd">
						{t("settings.current_password", "Current password")}
					</Label>
					<Input
						id="enable-2fa-pwd"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleStartSetup()}
						autoFocus
					/>
					{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
				</div>
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
					className="h-48 w-48 rounded border border-border"
				/>
			) : (
				<div className="h-48 w-48 animate-pulse rounded border border-border bg-muted" />
			)}
			<p className="text-muted-foreground text-xs">
				{t("settings.2fa_or_enter_manually", "Or enter this key manually:")}
			</p>
			<code className="block select-all break-all rounded bg-muted px-2 py-1 text-xs">
				{totpUri}
			</code>
			<div className="space-y-1.5">
				<Label htmlFor="totp-code">
					{t("settings.2fa_totp_code", "6-digit code from your app")}
				</Label>
				<Input
					id="totp-code"
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
				{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
			</div>
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

// ─── Security tab ─────────────────────────────────────────────────────────────

export function SysAdminSecurityTab() {
	const { t } = useTranslation();
	const [currentPwd, setCurrentPwd] = useState("");
	const [newPwd, setNewPwd] = useState("");
	const [confirmPwd, setConfirmPwd] = useState("");
	const [saving, setSaving] = useState(false);
	const [msg, setMsg] = useState("");

	const handleChangePwd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPwd !== confirmPwd) {
			setMsg(t("auth.passwords_dont_match", "Passwords don't match"));
			return;
		}
		if (newPwd.length < 8) {
			setMsg(
				t(
					"sysadmin.settings.pwd_min_length",
					"Password must be at least 8 characters.",
				),
			);
			return;
		}
		setSaving(true);
		setMsg("");
		try {
			const res = await authClient.changePassword({
				currentPassword: currentPwd,
				newPassword: newPwd,
				revokeOtherSessions: true,
			});
			if (res.error) {
				setMsg(res.error.message ?? t("common.error", "An error occurred"));
			} else {
				setMsg(
					t("settings.password_changed", "Password changed successfully."),
				);
				setCurrentPwd("");
				setNewPwd("");
				setConfirmPwd("");
			}
		} catch {
			setMsg(t("common.error", "An error occurred"));
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-8">
			<form onSubmit={handleChangePwd} className="max-w-sm space-y-4">
				<h3 className="font-semibold text-foreground">
					{t("settings.change_password", "Change password")}
				</h3>
				<div className="space-y-1.5">
					<Label htmlFor="current-pwd">
						{t("settings.current_password", "Current password")}
					</Label>
					<Input
						id="current-pwd"
						type="password"
						value={currentPwd}
						onChange={(e) => setCurrentPwd(e.target.value)}
						autoComplete="current-password"
						required
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="new-pwd">
						{t("settings.new_password", "New password")}
					</Label>
					<Input
						id="new-pwd"
						type="password"
						value={newPwd}
						onChange={(e) => setNewPwd(e.target.value)}
						autoComplete="new-password"
						required
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="confirm-pwd">
						{t("settings.confirm_password", "Confirm new password")}
					</Label>
					<Input
						id="confirm-pwd"
						type="password"
						value={confirmPwd}
						onChange={(e) => setConfirmPwd(e.target.value)}
						autoComplete="new-password"
						required
					/>
				</div>
				{msg && <p className="text-muted-foreground text-sm">{msg}</p>}
				<Button type="submit" disabled={saving}>
					{saving
						? t("common.saving", "Saving…")
						: t("settings.change_password_btn", "Change password")}
				</Button>
			</form>

			<div className="max-w-sm border-border border-t pt-8">
				<h3 className="mb-1 font-semibold text-foreground">
					{t("settings.security_title", "Two-Factor Authentication")}
				</h3>
				<p className="mb-4 text-muted-foreground text-xs">
					{t(
						"settings.security_desc",
						"Add an extra layer of security to your account using an authenticator app.",
					)}
				</p>
				<TwoFactorSection />
			</div>
		</div>
	);
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function SysAdminSettings() {
	const { t } = useTranslation();
	useBreadcrumbs([
		{ label: t("sysadmin.settings.title", "Settings & profile") },
	]);

	const TABS = [
		{
			to: "/sysadmin/settings/profile",
			label: t("settings.tab_profile", "Profile"),
			icon: <User className="h-4 w-4" />,
		},
		{
			to: "/sysadmin/settings/security",
			label: t("settings.tab_security", "Security"),
			icon: <KeyRound className="h-4 w-4" />,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl text-foreground">
					{t("sysadmin.settings.title", "Settings & profile")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("sysadmin.settings.subtitle", "Manage your admin account")}
				</p>
			</div>

			<div className="flex border-border border-b" role="tablist">
				{TABS.map(({ to, label, icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							cn(
								"inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 font-medium text-sm transition-colors",
								"-mb-px border-b-2 focus-visible:outline-none",
								isActive
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)
						}
					>
						{icon}
						{label}
					</NavLink>
				))}
			</div>

			<Outlet />
		</div>
	);
}
