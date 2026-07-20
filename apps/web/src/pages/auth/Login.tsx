import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import type { TFunction } from "i18next";
import { Building2, ChevronLeft, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { Spinner } from "../../components/ui/spinner";
import { authClient } from "../../lib/auth-client";
import { detectOrganizationSlug } from "../../lib/organization";

const container = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
	hidden: { opacity: 0, y: 14 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const buildLoginSchema = (t: TFunction) =>
	z.object({
		email: z.string().email(t("auth.validation.email")),
		password: z.string().min(6, t("auth.validation.passwordMin", { count: 6 })),
		rememberMe: z.boolean().optional(),
	});

type LoginFormData = z.infer<ReturnType<typeof buildLoginSchema>>;
type Organization = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
};

// ── Cloud mode: login then pick institution ───────────────────────────────────

type OrgPickerProps = {
	orgs: Organization[];
	onSelect: (org: Organization) => Promise<void>;
	onBack: () => void;
};

const OrgPicker: React.FC<OrgPickerProps> = ({ orgs, onSelect, onBack }) => {
	const { t } = useTranslation();
	const [selecting, setSelecting] = React.useState<string | null>(null);

	const handleSelect = async (org: Organization) => {
		setSelecting(org.id);
		await onSelect(org);
		setSelecting(null);
	};

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="visible"
			className="space-y-6"
		>
			<motion.div variants={item}>
				<h2 className="text-foreground">
					{t("auth.orgPicker.title", {
						defaultValue: "Choisissez votre établissement",
					})}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.orgPicker.subtitle", {
						defaultValue:
							"Sélectionnez l'établissement auquel vous souhaitez accéder.",
					})}
				</p>
			</motion.div>

			{orgs.length === 0 ? (
				<motion.div
					variants={item}
					className="rounded-xl border border-dashed p-8 text-center"
				>
					<Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						{t("auth.orgPicker.noOrgs", {
							defaultValue:
								"Aucun établissement trouvé pour ce compte. Contactez votre administrateur.",
						})}
					</p>
				</motion.div>
			) : (
				<motion.div variants={item} className="space-y-2">
					{orgs.map((org) => (
						<button
							key={org.id}
							type="button"
							onClick={() => handleSelect(org)}
							disabled={selecting !== null}
							className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent disabled:opacity-60"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								{org.logo ? (
									<img
										src={org.logo}
										alt={org.name}
										className="h-8 w-8 rounded object-cover"
									/>
								) : (
									<Building2 className="h-5 w-5 text-primary" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-foreground text-sm">
									{org.name}
								</p>
								<p className="truncate text-muted-foreground text-xs">
									{org.slug}
								</p>
							</div>
							{selecting === org.id && (
								<Spinner className="h-4 w-4 shrink-0 text-primary" />
							)}
						</button>
					))}
				</motion.div>
			)}

			<motion.div variants={item}>
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
				>
					<ChevronLeft className="h-4 w-4" />
					{t("auth.orgPicker.back", { defaultValue: "Changer de compte" })}
				</button>
			</motion.div>
		</motion.div>
	);
};

type LoginWithOrgPickerProps = { callbackURL?: string | null };

const LoginWithOrgPicker: React.FC<LoginWithOrgPickerProps> = ({
	callbackURL,
}) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const loginSchema = React.useMemo(() => buildLoginSchema(t), [t]);
	const { data: session, isPending } = authClient.useSession();

	const [step, setStep] = React.useState<"login" | "pick">("login");
	const [orgs, setOrgs] = React.useState<Organization[]>([]);
	const [loadingOrgs, setLoadingOrgs] = React.useState(false);
	const [rememberMe, setRememberMe] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	// If already authenticated (e.g. back button), skip to org picker
	React.useEffect(() => {
		if (!isPending && session?.user) {
			fetchOrgs();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPending, session?.user?.id]);

	const fetchOrgs = async () => {
		setLoadingOrgs(true);
		const result = await authClient.organization.list();
		setOrgs((result.data as Organization[] | null) ?? []);
		setStep("pick");
		setLoadingOrgs(false);
	};

	const onSubmit = async (data: LoginFormData) => {
		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe,
		});
		if (result.error) {
			toast.error(result.error.message || t("auth.login.error"));
			return;
		}
		await fetchOrgs();
	};

	const handleSelectOrg = async (org: Organization) => {
		await authClient.organization.setActive({ organizationId: org.id });
		navigate(callbackURL || "/");
	};

	const handleBack = async () => {
		await authClient.signOut();
		setOrgs([]);
		setStep("login");
	};

	if (isPending || loadingOrgs) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Spinner className="h-8 w-8 text-primary" />
			</div>
		);
	}

	if (step === "pick") {
		return (
			<OrgPicker orgs={orgs} onSelect={handleSelectOrg} onBack={handleBack} />
		);
	}

	return (
		<motion.div variants={container} initial="hidden" animate="visible">
			<motion.div variants={item} className="mb-8">
				<h2 className="text-foreground">{t("auth.login.title")}</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.login.subtitle", {
						defaultValue: "Connectez-vous pour accéder à vos établissements.",
					})}
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={item} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.login.emailPlaceholder")}
					/>
					{errors.email && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.email.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="space-y-2">
					<Label htmlFor="password">{t("common.fields.password")}</Label>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.login.passwordPlaceholder")}
					/>
					{errors.password && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.password.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="flex items-center gap-2">
					<Checkbox
						id="remember"
						checked={rememberMe}
						onCheckedChange={(v) => setRememberMe(Boolean(v))}
					/>
					<Label
						htmlFor="remember"
						className="cursor-pointer font-normal text-sm"
					>
						{t("auth.login.rememberMe", {
							defaultValue: "Se souvenir de moi pendant 30 jours",
						})}
					</Label>
				</motion.div>

				<motion.div variants={item}>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="h-11 w-full font-semibold"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("auth.login.submitting")}
							</>
						) : (
							t("auth.login.submit")
						)}
					</Button>
				</motion.div>
			</form>
		</motion.div>
	);
};

// ── Scoped mode (on-premise or subdomain) ────────────────────────────────────

const Login: React.FC = () => {
	const { t } = useTranslation();
	const loginSchema = React.useMemo(() => buildLoginSchema(t), [t]);
	const orgSlug = detectOrganizationSlug();

	const [rememberMe, setRememberMe] = React.useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});
	const [callbackURL] = useQueryState("return", {});

	if (!orgSlug) {
		return <LoginWithOrgPicker callbackURL={callbackURL} />;
	}

	const onSubmit = async (data: LoginFormData) => {
		const result = await authClient.signIn.email({
			email: data.email,
			password: data.password,
			rememberMe,
			callbackURL: callbackURL || undefined,
			fetchOptions: { headers: { "X-Organization-Slug": orgSlug } },
		});
		if (result.error) {
			toast.error(result.error.message || t("auth.login.error"));
			return;
		}
		toast.success(t("auth.login.success"));
	};

	return (
		<motion.div variants={container} initial="hidden" animate="visible">
			<motion.div variants={item} className="mb-8">
				<h2 className="text-foreground">{t("auth.login.title")}</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("auth.login.subtitle", {
						defaultValue: "Connectez-vous à votre espace.",
					})}
				</p>
			</motion.div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<motion.div variants={item} className="space-y-2">
					<Label htmlFor="email">{t("common.fields.email")}</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						className="h-11"
						placeholder={t("auth.login.emailPlaceholder")}
					/>
					{errors.email && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.email.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">{t("common.fields.password")}</Label>
						<Link
							to={`/auth/forgot?return=${callbackURL}`}
							className="text-primary text-sm hover:text-primary/80"
						>
							{t("auth.login.forgotPassword")}
						</Link>
					</div>
					<PasswordInput
						id="password"
						{...register("password")}
						className="h-11"
						placeholder={t("auth.login.passwordPlaceholder")}
					/>
					{errors.password && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-destructive text-sm"
						>
							{errors.password.message}
						</motion.p>
					)}
				</motion.div>

				<motion.div variants={item} className="flex items-center gap-2">
					<Checkbox
						id="remember"
						checked={rememberMe}
						onCheckedChange={(v) => setRememberMe(Boolean(v))}
					/>
					<Label
						htmlFor="remember"
						className="cursor-pointer font-normal text-sm"
					>
						{t("auth.login.rememberMe", {
							defaultValue: "Se souvenir de moi pendant 30 jours",
						})}
					</Label>
				</motion.div>

				<motion.div variants={item}>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="h-11 w-full font-semibold"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("auth.login.submitting")}
							</>
						) : (
							t("auth.login.submit")
						)}
					</Button>
				</motion.div>
			</form>
		</motion.div>
	);
};

export default Login;
