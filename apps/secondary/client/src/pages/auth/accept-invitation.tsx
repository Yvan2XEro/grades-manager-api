import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth-client";

// ─── Sign-up form (new user path) ────────────────────────────────────────────

const signUpSchema = z
	.object({
		name: z.string().min(1),
		email: z.string().email(),
		password: z.string().min(8),
		confirm: z.string().min(1),
	})
	.refine((d) => d.password === d.confirm, {
		path: ["confirm"],
		message: "Passwords do not match",
	});

type SignUpValues = z.infer<typeof signUpSchema>;

function SignUpForm({
	invitationId,
	defaultEmail,
	onSuccess,
}: {
	invitationId: string;
	defaultEmail?: string;
	onSuccess: () => void;
}) {
	const { t } = useTranslation();
	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { email: defaultEmail ?? "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		setServerError("");
		const signUpResult = await authClient.signUp.email({
			email: values.email,
			password: values.password,
			name: values.name,
		});
		if (signUpResult.error) {
			setServerError(
				signUpResult.error.message ??
					t("auth.sign_up_failed", "Sign-up failed"),
			);
			return;
		}
		const acceptResult = await authClient.organization.acceptInvitation({
			invitationId,
		});
		if (acceptResult.error) {
			setServerError(
				acceptResult.error.message ??
					t("invite.accept_failed", "Could not accept invitation"),
			);
			return;
		}
		onSuccess();
	});

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="name">{t("auth.full_name", "Full name")}</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="text-destructive text-xs">{errors.name.message}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="email">{t("auth.email", "Email")}</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					{...register("email")}
				/>
				<p className="text-muted-foreground text-xs">
					{t(
						"invite.email_hint",
						"Use the email address this invitation was sent to.",
					)}
				</p>
				{errors.email && (
					<p className="text-destructive text-xs">{errors.email.message}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="password">{t("auth.password", "Password")}</Label>
				<Input
					id="password"
					type="password"
					autoComplete="new-password"
					{...register("password")}
				/>
				{errors.password && (
					<p className="text-destructive text-xs">{errors.password.message}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="confirm">
					{t("auth.confirm_password", "Confirm password")}
				</Label>
				<Input
					id="confirm"
					type="password"
					autoComplete="new-password"
					{...register("confirm")}
				/>
				{errors.confirm && (
					<p className="text-destructive text-xs">{errors.confirm.message}</p>
				)}
			</div>
			{serverError && <p className="text-destructive text-sm">{serverError}</p>}
			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting
					? t("common.loading", "Loading…")
					: t("invite.create_and_accept", "Create account & accept invitation")}
			</Button>
		</form>
	);
}

// ─── Sign-in form (already has account) ──────────────────────────────────────

const signInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

type SignInValues = z.infer<typeof signInSchema>;

function SignInForm({
	invitationId,
	defaultEmail,
	onSuccess,
}: {
	invitationId: string;
	defaultEmail?: string;
	onSuccess: () => void;
}) {
	const { t } = useTranslation();
	const [serverError, setServerError] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: defaultEmail ?? "" },
	});

	const onSubmit = handleSubmit(async (values) => {
		setServerError("");
		const signInResult = await authClient.signIn.email({
			email: values.email,
			password: values.password,
		});
		if (signInResult.error) {
			setServerError(
				signInResult.error.message ??
					t("auth.invalid_credentials", "Invalid credentials"),
			);
			return;
		}
		const acceptResult = await authClient.organization.acceptInvitation({
			invitationId,
		});
		if (acceptResult.error) {
			setServerError(
				acceptResult.error.message ??
					t("invite.accept_failed", "Could not accept invitation"),
			);
			return;
		}
		onSuccess();
	});

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="email">{t("auth.email", "Email")}</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					{...register("email")}
				/>
				{errors.email && (
					<p className="text-destructive text-xs">{errors.email.message}</p>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="password">{t("auth.password", "Password")}</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					{...register("password")}
				/>
				{errors.password && (
					<p className="text-destructive text-xs">{errors.password.message}</p>
				)}
			</div>
			{serverError && <p className="text-destructive text-sm">{serverError}</p>}
			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting
					? t("common.loading", "Loading…")
					: t("invite.sign_in_and_accept", "Sign in & accept invitation")}
			</Button>
		</form>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Mode = "signup" | "signin" | "accepting" | "success" | "error";

export function AcceptInvitation() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const defaultEmail = searchParams.get("email") ?? undefined;
	const navigate = useNavigate();
	const { data: session, isPending: sessionLoading } = useSession();
	const [mode, setMode] = useState<Mode>("signup");
	const [errorMsg, setErrorMsg] = useState("");

	// ── Already authenticated: accept directly ────────────────────────────────
	const handleAuthenticatedAccept = async () => {
		if (!id) return;
		setMode("accepting");
		const result = await authClient.organization.acceptInvitation({
			invitationId: id,
		});
		if (result.error) {
			setErrorMsg(
				result.error.message ??
					t("invite.expired", "This invitation has expired or is invalid."),
			);
			setMode("error");
		} else {
			setMode("success");
			setTimeout(() => {
				window.location.href = "/";
			}, 2000);
		}
	};

	const handleSuccess = () => {
		setMode("success");
		setTimeout(() => {
			window.location.href = "/";
		}, 2000);
	};

	if (!id) {
		return (
			<PageShell>
				<ErrorState
					message={t("invite.invalid_link", "Invalid invitation link.")}
					onLogin={() => navigate("/login")}
				/>
			</PageShell>
		);
	}

	if (sessionLoading) {
		return (
			<PageShell>
				<Spinner />
			</PageShell>
		);
	}

	// Authenticated user: show accept button
	if (session) {
		if (mode === "accepting") {
			return (
				<PageShell>
					<Spinner />
				</PageShell>
			);
		}
		if (mode === "success") {
			return (
				<PageShell>
					<SuccessState />
				</PageShell>
			);
		}
		if (mode === "error") {
			return (
				<PageShell>
					<ErrorState message={errorMsg} onLogin={() => navigate("/login")} />
				</PageShell>
			);
		}
		return (
			<PageShell>
				<div className="space-y-4 text-center">
					<p className="text-muted-foreground text-sm">
						{t("invite.logged_in_as", "Signed in as")}{" "}
						<span className="font-medium text-foreground">
							{session.user.email}
						</span>
					</p>
					<Button className="w-full" onClick={handleAuthenticatedAccept}>
						{t("invite.accept_btn", "Accept invitation")}
					</Button>
					<p className="text-muted-foreground text-xs">
						{t("invite.wrong_account", "Wrong account?")}{" "}
						<button
							type="button"
							onClick={() => authClient.signOut()}
							className="text-primary underline underline-offset-4"
						>
							{t("auth.sign_out", "Sign out")}
						</button>
					</p>
				</div>
			</PageShell>
		);
	}

	// Unauthenticated: sign-up (primary) or sign-in
	if (mode === "success") {
		return (
			<PageShell>
				<SuccessState />
			</PageShell>
		);
	}

	return (
		<PageShell>
			<div className="mb-2 flex rounded-lg border border-border bg-muted/40 p-1">
				<button
					type="button"
					className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${mode === "signup" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
					onClick={() => setMode("signup")}
				>
					{t("invite.tab_create", "Create account")}
				</button>
				<button
					type="button"
					className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${mode === "signin" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
					onClick={() => setMode("signin")}
				>
					{t("invite.tab_signin", "Sign in")}
				</button>
			</div>

			{mode === "signup" && (
				<SignUpForm
					invitationId={id}
					defaultEmail={defaultEmail}
					onSuccess={handleSuccess}
				/>
			)}
			{mode === "signin" && (
				<SignInForm
					invitationId={id}
					defaultEmail={defaultEmail}
					onSuccess={handleSuccess}
				/>
			)}
		</PageShell>
	);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation();
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
				<h1 className="mb-1 font-bold text-2xl text-primary">
					{t("app.name")}
				</h1>
				<p className="mb-6 text-muted-foreground text-sm">
					{t(
						"invite.page_subtitle",
						"You've been invited to join the platform.",
					)}
				</p>
				{children}
			</div>
		</div>
	);
}

function Spinner() {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center gap-3 py-4">
			<div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			<p className="text-muted-foreground text-sm">
				{t("invite.processing", "Activating your account…")}
			</p>
		</div>
	);
}

function SuccessState() {
	const { t } = useTranslation();
	return (
		<div className="space-y-3 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
				<svg
					className="h-6 w-6 text-green-600 dark:text-green-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<p className="font-semibold text-foreground">
				{t("invite.success_title", "Account activated")}
			</p>
			<p className="text-muted-foreground text-sm">
				{t("invite.success_hint", "Redirecting…")}
			</p>
		</div>
	);
}

function ErrorState({
	message,
	onLogin,
}: {
	message: string;
	onLogin: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="space-y-3 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
				<svg
					className="h-6 w-6 text-red-600 dark:text-red-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</div>
			<p className="font-semibold text-foreground">
				{t("invite.error_title", "Invitation error")}
			</p>
			<p className="text-muted-foreground text-sm">{message}</p>
			<button
				type="button"
				onClick={onLogin}
				className="text-primary text-sm underline underline-offset-4"
			>
				{t("invite.go_to_login", "Go to login")}
			</button>
		</div>
	);
}
