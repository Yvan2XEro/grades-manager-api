export const fr = {
	common: {
		greeting: (name: string) => `Bonjour ${name},`,
		footer_tagline:
			"La plateforme SIS LMD-first pour les universités et IPES d'Afrique.",
		footer_unsubscribe: "Vous recevez cet email car vous avez un compte TKAMS.",
		footer_rights: "© 2026 TKAMS. Tous droits réservés.",
		visit_platform: "Accéder à la plateforme",
		help: "Besoin d'aide ?",
		help_link: "Contactez-nous",
		unsubscribe: "Se désabonner",
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
	productLaunch: {
		subject: "Découvrez le nouveau TKAMS",
		eyebrow: "Disponible maintenant",
		title: "Une gestion plus claire de votre établissement",
		subtitle:
			"TKAMS réunit les opérations académiques, les équipes et les décisions dans un espace fiable.",
		greeting: (name: string) => `Bonjour ${name} — TKAMS est prêt pour vous.`,
		intro:
			"De la structure académique aux dossiers étudiants et aux délibérations, TKAMS offre à votre équipe un espace unique pour avancer avec des données cohérentes.",
		features: [
			{
				title: "Une source académique unique",
				body: "Reliez années, filières, classes, matières et affectations dès le départ.",
			},
			{
				title: "Des workflows fiables pour l’équipe",
				body: "Donnez à chaque rôle les accès adaptés aux étudiants, notes, présences et finances.",
			},
			{
				title: "Des décisions prêtes à partager",
				body: "Transformez les résultats et délibérations en rapports et documents exploitables.",
			},
		],
		cta: "Découvrir TKAMS",
		closing:
			"Construisez une gestion académique plus fiable, workflow après workflow.",
	},
	secondaryLaunch: {
		subject: "Découvrez TKAMS Secondaire",
		eyebrow: "Disponible pour les établissements secondaires",
		title: "De la configuration au bulletin final",
		subtitle:
			"TKAMS Secondaire accompagne les équipes scolaires avec un parcours connecté pour toute l’année.",
		greeting: (name: string) =>
			`Bonjour ${name} — votre espace secondaire est prêt.`,
		intro:
			"Créez votre établissement, invitez l’équipe, organisez classes et matières, puis suivez les notes jusqu’aux conseils de classe et aux bulletins.",
		features: [
			{
				title: "Configurer sereinement",
				body: "Commencez avec une année scolaire, des trimestres, classes et matières qui correspondent à votre établissement.",
			},
			{
				title: "Faire travailler chaque rôle",
				body: "Owners et admins configurent l’école tandis que les enseignants travaillent dans leurs classes et matières affectées.",
			},
			{
				title: "Terminer avec des documents utiles",
				body: "Saisissez les notes, préparez les conseils et générez des bulletins prêts à télécharger et partager.",
			},
		],
		cta: "Découvrir TKAMS Secondaire",
		closing:
			"Le quotidien de votre établissement, connecté de la configuration à la décision.",
	},
} as const;
