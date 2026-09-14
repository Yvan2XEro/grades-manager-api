export const en = {
	common: {
		greeting: (name: string) => `Hello ${name},`,
		footer_tagline:
			"The LMD-first SIS platform for French-speaking African universities.",
		footer_unsubscribe:
			"You're receiving this email because you have a TKAMS account.",
		footer_rights: "© 2026 TKAMS. All rights reserved.",
		visit_platform: "Go to the platform",
		help: "Need help?",
		help_link: "Contact us",
	},
	resetPassword: {
		subject: "Reset your TKAMS password",
		title: "Password Reset",
		intro:
			"You requested a password reset. Click the button below to choose a new one.",
		cta: "Reset Password",
		expiry: "This link expires in 1 hour.",
		ignore:
			"If you didn't request this, ignore this email. Your password remains unchanged.",
		url_fallback: "Or copy this link into your browser:",
	},
	staffInvitation: {
		subject: (institution: string) =>
			`You're invited to join ${institution} on TKAMS`,
		title: "You're invited!",
		intro: (role: string, institution: string) =>
			`You've been invited as <strong>${role}</strong> to join <strong>${institution}</strong> on TKAMS.`,
		cta: "Accept Invitation",
		expiry: "This invitation expires in 48 hours.",
		about:
			"TKAMS is the LMD academic management platform designed for Francophone universities.",
	},
	welcomeInstitution: {
		subject: "Welcome to TKAMS 🎓",
		title: "Welcome to TKAMS!",
		intro: (institution: string) =>
			`Your institution <strong>${institution}</strong> is now set up on TKAMS. You can start managing your students, grades and deliberations.`,
		cta: "Get Started",
		steps_title: "Next steps",
		steps: [
			"Set up your academic structure (faculties, programmes, classes)",
			"Import your students",
			"Invite your teaching staff",
		],
	},
} as const;
