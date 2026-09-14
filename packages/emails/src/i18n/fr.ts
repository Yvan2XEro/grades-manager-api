export const fr = {
	common: {
		greeting: (name: string) => `Bonjour ${name},`,
		footer_tagline:
			"La plateforme SIS LMD-first pour les universités et IPES d'Afrique francophone.",
		footer_unsubscribe: "Vous recevez cet email car vous avez un compte TKAMS.",
		footer_rights: "© 2026 TKAMS. Tous droits réservés.",
		visit_platform: "Accéder à la plateforme",
		help: "Besoin d'aide ?",
		help_link: "Contactez-nous",
	},
	resetPassword: {
		subject: "Réinitialisez votre mot de passe TKAMS",
		title: "Réinitialisation du mot de passe",
		intro:
			"Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
		cta: "Réinitialiser le mot de passe",
		expiry: "Ce lien expire dans 1 heure.",
		ignore:
			"Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe reste inchangé.",
		url_fallback: "Ou copiez ce lien dans votre navigateur :",
	},
	staffInvitation: {
		subject: (institution: string) =>
			`Invitation à rejoindre ${institution} sur TKAMS`,
		title: "Vous êtes invité(e) !",
		intro: (role: string, institution: string) =>
			`Vous avez été invité(e) en tant que <strong>${role}</strong> pour rejoindre <strong>${institution}</strong> sur TKAMS.`,
		cta: "Accepter l'invitation",
		expiry: "Cette invitation expire dans 48 heures.",
		about:
			"TKAMS est la plateforme de gestion académique LMD conçue pour les universités francophones.",
	},
	welcomeInstitution: {
		subject: "Bienvenue sur TKAMS 🎓",
		title: "Bienvenue sur TKAMS !",
		intro: (institution: string) =>
			`Votre établissement <strong>${institution}</strong> est maintenant configuré sur TKAMS. Vous pouvez commencer à gérer vos étudiants, vos notes et vos délibérations.`,
		cta: "Commencer",
		steps_title: "Prochaines étapes",
		steps: [
			"Configurez votre structure académique (facultés, filières, classes)",
			"Importez vos étudiants",
			"Invitez votre équipe pédagogique",
		],
	},
} as const;
