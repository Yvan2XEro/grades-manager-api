import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	AlertTriangle,
	Ban,
	CheckCircle2,
	KeyRound,
	Link2,
	Loader2,
	MailCheck,
	RefreshCw,
	ShieldCheck,
	ShieldOff,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { trpcClient } from "@/utils/trpc";
import { useProfileContext } from "./ProfileContext";

const ASSIGNABLE_ROLES = [
	{ value: "administrator", label: "Administrateur" },
	{ value: "dean", label: "Doyen" },
	{ value: "teacher", label: "Enseignant" },
	{ value: "grade_editor", label: "Éditeur de notes" },
	{ value: "staff", label: "Personnel" },
	{ value: "student", label: "Étudiant" },
] as const;

const createAccountSchema = z.object({
	email: z.string().email("Email invalide"),
	password: z.string().min(8, "Mot de passe de 8 caractères minimum"),
	memberRole: z.string().min(1, "Rôle requis"),
});

const linkAccountSchema = z.object({
	authEmail: z.string().email("Email invalide"),
});

type CreateAccountValues = z.infer<typeof createAccountSchema>;
type LinkAccountValues = z.infer<typeof linkAccountSchema>;

/* ── Subform: Create auth account ─────────────────────────────────── */

function CreateAccountForm({ profileId }: { profileId: string }) {
	const queryClient = useQueryClient();
	const form = useForm<CreateAccountValues>({
		resolver: zodResolver(createAccountSchema),
		defaultValues: { email: "", password: "", memberRole: "student" },
	});

	const mutation = useMutation({
		mutationFn: (values: CreateAccountValues) =>
			trpcClient.profiles.createAuthForProfile.mutate({
				profileId,
				email: values.email,
				password: values.password,
				memberRole: values.memberRole,
			}),
		onSuccess: () => {
			toast.success("Compte créé avec succès.");
			void queryClient.invalidateQueries({
				queryKey: ["profiles", "auth", profileId],
			});
			void queryClient.invalidateQueries({ queryKey: ["profiles", profileId] });
		},
		onError: (err: Error) => {
			const message = err.message.includes("already exists")
				? "Un compte avec cet email existe déjà."
				: "Erreur lors de la création du compte.";
			toast.error(message);
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="prenom.nom@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Mot de passe</FormLabel>
								<FormControl>
									<PasswordInput {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="memberRole"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Rôle</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Choisir un rôle" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ASSIGNABLE_ROLES.map((r) => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Créer le compte
					</Button>
				</div>
			</form>
		</Form>
	);
}

/* ── Subform: Link existing auth account ──────────────────────────── */

function LinkAccountForm({ profileId }: { profileId: string }) {
	const queryClient = useQueryClient();
	const form = useForm<LinkAccountValues>({
		resolver: zodResolver(linkAccountSchema),
		defaultValues: { authEmail: "" },
	});

	const mutation = useMutation({
		mutationFn: (values: LinkAccountValues) =>
			trpcClient.profiles.linkAuthAccount.mutate({
				profileId,
				authEmail: values.authEmail,
			}),
		onSuccess: () => {
			toast.success("Compte lié avec succès.");
			void queryClient.invalidateQueries({
				queryKey: ["profiles", "auth", profileId],
			});
			void queryClient.invalidateQueries({ queryKey: ["profiles", profileId] });
		},
		onError: (err: Error) => {
			const msg = err.message.includes("not a member")
				? "Cet utilisateur n'est pas membre de l'organisation."
				: err.message.includes("already linked")
					? "Ce compte est déjà lié à un autre profil."
					: "Erreur lors de la liaison du compte.";
			toast.error(msg);
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="authEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email du compte existant</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="utilisateur@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<p className="text-muted-foreground text-xs">
					L'utilisateur doit déjà être membre de l'organisation. Son profil sera
					lié à ce compte d'accès.
				</p>
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Lier le compte
					</Button>
				</div>
			</form>
		</Form>
	);
}

/* ── Main component ───────────────────────────────────────────────── */

export default function ProfileAccessTab() {
	const { profileId } = useProfileContext();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [banPending, setBanPending] = useState(false);
	const [resetPending, setResetPending] = useState(false);

	const { data: authAccount, isLoading } = useQuery({
		queryKey: ["profiles", "auth", profileId],
		queryFn: () => trpcClient.profiles.getAuthAccount.query({ profileId }),
	});

	const handlePasswordReset = async () => {
		setResetPending(true);
		try {
			await trpcClient.profiles.sendPasswordReset.mutate({ profileId });
			toast.success("Email de réinitialisation envoyé.");
		} catch {
			toast.error("Erreur lors de l'envoi de l'email.");
		} finally {
			setResetPending(false);
		}
	};

	const handleBanToggle = async () => {
		if (!authAccount) return;
		setBanPending(true);
		try {
			await trpcClient.profiles.setBanStatus.mutate({
				profileId,
				banned: !authAccount.banned,
			});
			toast.success(
				authAccount.banned ? "Compte réactivé." : "Compte suspendu.",
			);
			void queryClient.invalidateQueries({
				queryKey: ["profiles", "auth", profileId],
			});
		} catch {
			toast.error("Erreur lors de la mise à jour du statut.");
		} finally {
			setBanPending(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const roleLabel =
		ASSIGNABLE_ROLES.find((r) => r.value === authAccount?.memberRole)?.label ??
		authAccount?.memberRole;

	return (
		<div className="space-y-6 pt-6">
			{/* Account overview card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCheck className="h-4 w-4 text-primary" />
						Compte d'accès
					</CardTitle>
					<CardDescription>
						Statut du compte de connexion lié à ce profil.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{authAccount ? (
						<div className="space-y-4">
							<div className="flex flex-wrap items-center gap-3">
								<span className="font-medium text-sm">{authAccount.email}</span>
								{authAccount.emailVerified ? (
									<Badge
										variant="secondary"
										className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
									>
										<MailCheck className="h-3 w-3" />
										Email vérifié
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="gap-1 text-muted-foreground"
									>
										<AlertTriangle className="h-3 w-3" />
										Email non vérifié
									</Badge>
								)}
								{authAccount.banned ? (
									<Badge variant="destructive" className="gap-1">
										<Ban className="h-3 w-3" />
										Suspendu
									</Badge>
								) : (
									<Badge
										variant="secondary"
										className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
									>
										<CheckCircle2 className="h-3 w-3" />
										Actif
									</Badge>
								)}
							</div>
							<Separator />
							<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
								<div className="space-y-1">
									<p className="text-muted-foreground text-xs">Rôle</p>
									<p className="font-medium capitalize">{roleLabel ?? "—"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-xs">Membre depuis</p>
									<p className="font-medium">
										{authAccount.memberSince
											? format(new Date(authAccount.memberSince), "dd/MM/yyyy")
											: "—"}
									</p>
								</div>
							</div>
						</div>
					) : (
						<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
							<div>
								<p className="font-medium text-amber-800 text-sm dark:text-amber-200">
									Aucun compte d'accès
								</p>
								<p className="text-amber-700 text-xs dark:text-amber-300">
									Ce profil n'est pas lié à un compte de connexion.
									L'utilisateur ne peut pas se connecter à la plateforme.
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Provision / link card — only when no account */}
			{!authAccount && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<KeyRound className="h-4 w-4 text-primary" />
							Provisionnement
						</CardTitle>
						<CardDescription>
							Créez un nouveau compte ou liez un compte existant à ce profil.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="create">
							<TabsList className="mb-6">
								<TabsTrigger value="create" className="gap-2">
									<KeyRound className="h-3.5 w-3.5" />
									Créer un compte
								</TabsTrigger>
								<TabsTrigger value="link" className="gap-2">
									<Link2 className="h-3.5 w-3.5" />
									Lier un compte existant
								</TabsTrigger>
							</TabsList>
							<TabsContent value="create">
								<CreateAccountForm profileId={profileId} />
							</TabsContent>
							<TabsContent value="link">
								<LinkAccountForm profileId={profileId} />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{/* Security actions card — only when account exists */}
			{authAccount && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-primary" />
							Actions de sécurité
						</CardTitle>
						<CardDescription>
							Gérez l'accès et la sécurité du compte de cet utilisateur.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
							<div className="space-y-1">
								<p className="font-medium text-sm">
									Réinitialiser le mot de passe
								</p>
								<p className="text-muted-foreground text-xs">
									Envoie un email de réinitialisation à{" "}
									<span className="font-mono">{authAccount.email}</span>.
								</p>
							</div>
							<Button
								variant="outline"
								onClick={handlePasswordReset}
								disabled={resetPending}
								className="w-full md:w-auto"
							>
								{resetPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="mr-2 h-4 w-4" />
								)}
								Envoyer l'email
							</Button>
						</div>
						<Separator />
						<div className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
							<div className="space-y-1">
								<p className="font-medium text-sm">
									{authAccount.banned
										? "Réactiver le compte"
										: "Suspendre le compte"}
								</p>
								<p className="text-muted-foreground text-xs">
									{authAccount.banned
										? "Permet à l'utilisateur de se reconnecter à la plateforme."
										: "Bloque immédiatement toutes les connexions de cet utilisateur."}
								</p>
							</div>
							<Button
								variant={authAccount.banned ? "outline" : "destructive"}
								onClick={handleBanToggle}
								disabled={banPending}
								className="w-full md:w-auto"
							>
								{banPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : authAccount.banned ? (
									<ShieldCheck className="mr-2 h-4 w-4" />
								) : (
									<ShieldOff className="mr-2 h-4 w-4" />
								)}
								{authAccount.banned ? "Réactiver" : "Suspendre"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
