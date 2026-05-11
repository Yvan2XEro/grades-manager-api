import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./flows",
	outputDir: "../presentation-assets/output",
	reporter: [
		["html", { outputFolder: "../presentation-assets/report", open: "never" }],
		["list"],
	],
	use: {
		// Vite dev server (port par défaut, pas de port explicite dans vite.config.ts)
		// Si le port diffère sur ta machine, passe PLAYWRIGHT_BASE_URL=http://localhost:XXXX
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5174",
		headless: false,
		slowMo: 700,
		viewport: { width: 1440, height: 900 },
		screenshot: "on",
		video: "on",
		colorScheme: "light",
		locale: "fr-FR",
		actionTimeout: 15_000,
		navigationTimeout: 20_000,
	},
	// Flows séquentiels — un seul navigateur à la fois
	workers: 1,
	retries: 0,
	projects: [
		{ name: "01 - Login & Dashboard", testMatch: "**/01-login.ts" },
		{ name: "02 - Gestion étudiants", testMatch: "**/02-students.ts" },
		{ name: "03 - Saisie des notes", testMatch: "**/03-grades.ts" },
		{ name: "04 - Validation examen", testMatch: "**/04-exam-validation.ts" },
		{ name: "05 - Délibération", testMatch: "**/05-deliberation.ts" },
		{ name: "06 - Export & Rapports", testMatch: "**/06-reports.ts" },
	],
});
