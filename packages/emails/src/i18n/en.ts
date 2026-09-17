export const en = {
	common: {
		greeting: (name: string) => `Hello ${name},`,
		footer_tagline: "The LMD-first SIS platform for African universities.",
		footer_unsubscribe:
			"You're receiving this email because you have a TKAMS account.",
		footer_rights: "© 2026 TKAMS. All rights reserved.",
		visit_platform: "Go to the platform",
		help: "Need help?",
		help_link: "Contact us",
		unsubscribe: "Unsubscribe",
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
	productLaunch: {
		subject: "Meet the new TKAMS",
		eyebrow: "Now available",
		title: "A clearer way to run your institution",
		subtitle:
			"TKAMS brings academic operations, people and decisions into one dependable workspace.",
		greeting: (name: string) => `Hi ${name} — TKAMS is ready for you.`,
		intro:
			"From academic structure to student records and deliberations, TKAMS gives your team one place to keep the work moving and the data consistent.",
		features: [
			{
				title: "One academic source of truth",
				body: "Keep years, programmes, classes, subjects and assignments connected from the start.",
			},
			{
				title: "Workflows your team can trust",
				body: "Give each role the right access for students, grades, attendance and finance.",
			},
			{
				title: "Decisions ready to share",
				body: "Turn results and deliberations into clear reports and institution-ready documents.",
			},
		],
		cta: "Explore TKAMS",
		closing:
			"Build a more reliable academic operation, one workflow at a time.",
	},
	secondaryLaunch: {
		subject: "Introducing TKAMS Secondary",
		eyebrow: "Now available for secondary schools",
		title: "From first setup to final report card",
		subtitle:
			"TKAMS Secondary gives school teams a guided, connected way to run the full school year.",
		greeting: (name: string) =>
			`Hi ${name} — your secondary school workspace is ready.`,
		intro:
			"Create your school, invite the team, organise classes and subjects, then carry grades through councils and report cards without losing the thread.",
		features: [
			{
				title: "Set up with confidence",
				body: "Start with a clean academic year, terms, classes and subjects that match your school.",
			},
			{
				title: "Bring every role into the flow",
				body: "Owners and admins configure the school while teachers work only in their assigned classes and subjects.",
			},
			{
				title: "Finish with usable documents",
				body: "Capture grades, prepare class councils and generate report cards that are ready to download and share.",
			},
		],
		cta: "Discover TKAMS Secondary",
		closing: "Your school’s daily work, connected from setup to decision.",
	},
} as const;
