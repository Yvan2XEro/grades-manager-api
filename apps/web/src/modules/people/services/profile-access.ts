import { z } from "zod";

export const ASSIGNABLE_ROLES = [
	{ value: "administrator", label: "Administrateur" },
	{ value: "dean", label: "Doyen" },
	{ value: "teacher", label: "Enseignant" },
	{ value: "grade_editor", label: "Éditeur de notes" },
	{ value: "staff", label: "Personnel" },
	{ value: "student", label: "Étudiant" },
] as const;

export const roleLabel = (role?: string | null) =>
	ASSIGNABLE_ROLES.find((r) => r.value === role)?.label ?? role;

export const createAccountSchema = z.object({
	email: z.string().email("Email invalide"),
	password: z.string().min(8, "Mot de passe de 8 caractères minimum"),
	memberRole: z.string().min(1, "Rôle requis"),
});

export const linkAccountSchema = z.object({
	authEmail: z.string().email("Email invalide"),
});

export type CreateAccountValues = z.infer<typeof createAccountSchema>;
export type LinkAccountValues = z.infer<typeof linkAccountSchema>;

export const createAccountErrorMessage = (err: Error) =>
	err.message.includes("already exists")
		? "Un compte avec cet email existe déjà."
		: "Erreur lors de la création du compte.";

export const linkAccountErrorMessage = (err: Error) =>
	err.message.includes("not a member")
		? "Cet utilisateur n'est pas membre de l'organisation."
		: err.message.includes("already linked")
			? "Ce compte est déjà lié à un autre profil."
			: "Erreur lors de la liaison du compte.";
