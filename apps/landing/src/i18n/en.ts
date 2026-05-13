import type { Translations } from "./fr";

export const en: Translations = {
	nav: {
		features: "Features",
		screenshots: "Preview",
		pricing: "Pricing",
		about: "About",
		login: "Sign in",
	},
	hero: {
		badge: "Tefoye & Kana Academic Management System",
		title1: "Manage grades,",
		title2: "drive academic results.",
		subtitle:
			"TKAMS is the complete academic platform for higher education institutions. From grade entry to final deliberations, everything in one place.",
		cta_primary: "Access the app",
		cta_secondary: "See features",
		stat1_value: "100%",
		stat1_label: "Secure data",
		stat2_value: "FR + EN",
		stat2_label: "Bilingual",
		stat3_value: "Zero",
		stat3_label: "Paper needed",
	},
	features: {
		kicker: "Features",
		title: "Everything your institution needs",
		subtitle:
			"From grade entry to final deliberations, TKAMS covers the entire academic cycle.",
		items: [
			{
				title: "Grades & Exams",
				description:
					"Teacher grade entry, exam session scheduling, progress tracking, and automatic result locking after jury validation.",
			},
			{
				title: "Academic Structure",
				description:
					"Cycles, programs, classes, teaching units, and courses configured to match your institution's exact organization.",
			},
			{
				title: "Deliberations & Juries",
				description:
					"Automatic weighted average calculation, credit validation, and ready-to-sign jury reports generated instantly.",
			},
			{
				title: "Student Tracking",
				description:
					"Enrollments, course attempts, auto-generated registration numbers, full academic history, and retake management.",
			},
			{
				title: "Exports & Documents",
				description:
					"Transcripts, exam reports, certificates, and Excel tables in a few clicks from the platform's certified data.",
			},
			{
				title: "Roles & Audit Trail",
				description:
					"Dean, administrator, teacher, secretary — each actor within their scope. Every sensitive change goes through an approval circuit.",
			},
		],
	},
	screenshots: {
		kicker: "Preview",
		title: "Discover the platform",
		subtitle: "A clear and intuitive interface designed for academic teams.",
		tabs: [
			{ id: "dashboard", label: "Dashboard", src: "/screens/dashboard.png" },
			{ id: "grades", label: "Grades", src: "/screens/grades.png" },
			{ id: "exams", label: "Exams", src: "/screens/exams.png" },
			{
				id: "deliberations",
				label: "Deliberations",
				src: "/screens/deliberations.png",
			},
			{ id: "students", label: "Students", src: "/screens/students.png" },
		],
	},
	pricing: {
		kicker: "Pricing",
		title: "Plans tailored to your institution",
		subtitle:
			"Each plan includes a one-time setup fee and an annual license. Contact us for a custom quote.",
		contact: "Contact the team",
		note: "All amounts in FCFA excl. tax. Custom quote based on your institution.",
		label_setup: "Setup fee",
		label_annual: "Annual license",
		plans: [
			{
				name: "TKAMS",
				description: "Complete academic management",
				highlight: false,
				badge: null,
				setup: "1,500,000 FCFA excl. tax",
				annual: [
					"2,000 FCFA / active student / year",
					"5,000 FCFA / user / year",
					"Annual minimum: 750,000 FCFA",
				],
				features: [
					"Academic structure (cycles, programs, classes, TU, EC)",
					"Student management and enrollments",
					"Grade entry, exams, and scheduling",
					"Deliberations and automatic result calculation",
					"PV exports, transcripts, and reports",
					"Accounts, roles, and approval workflows",
				],
			},
			{
				name: "DocFlow Academic",
				description: "Official document production",
				highlight: false,
				badge: null,
				setup: "1,200,000 FCFA excl. tax",
				annual: [
					"900,000 FCFA / year up to 5,000 documents",
					"150 FCFA per additional document",
				],
				features: [
					"Achievement certificates and diplomas",
					"Transcripts and academic certificates",
					"Custom jury reports",
					"Single or bulk generation",
					"Data feed via TKAMS or Excel files",
					"Print-ready PDF export",
				],
			},
			{
				name: "Integrated Campus Suite",
				description: "TKAMS + DocFlow in a unified environment",
				highlight: true,
				badge: "Full package",
				setup: "2,200,000 FCFA excl. tax",
				annual: [
					"1,800 FCFA / active student / year",
					"5,000 FCFA / user / year",
					"10,000 documents included / year",
					"100 FCFA per additional document",
				],
				features: [
					"All TKAMS features",
					"All DocFlow features",
					"Native integration between both solutions",
					"Reduced double entry and errors",
					"Savings vs. separate acquisition",
					"Extended onboarding support",
				],
			},
		],
	},
	about: {
		kicker: "About",
		title: "Built by Overbrand",
		description:
			"TKAMS is designed and maintained by Overbrand, a digital agency specializing in tech solutions for businesses and institutions. Based in Douala, Cameroon, Overbrand combines creativity, technology, and strategy to deliver high-performance, lasting digital products.",
		tagline: '"Your vision realized"',
		stat1_value: "50+",
		stat1_label: "Projects delivered",
		stat2_value: "5+",
		stat2_label: "Years of experience",
		stat3_value: "7",
		stat3_label: "Services offered",
		cta: "Discover Overbrand",
	},
	footer: {
		tagline: "The academic platform of excellent institutions.",
		product: "Product",
		features: "Features",
		screenshots: "Preview",
		pricing: "Pricing",
		company: "Company",
		about: "About",
		contact: "Contact",
		app: "Application",
		access: "Access the app",
		copyright_prefix: "©",
		copyright_suffix: "TKAMS — Built by",
	},
};
