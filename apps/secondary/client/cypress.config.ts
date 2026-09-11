import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: "http://localhost:5173",
		specPattern: "cypress/e2e/**/*.cy.ts",
		supportFile: "cypress/support/e2e.ts",
		viewportWidth: 1440,
		viewportHeight: 900,
		defaultCommandTimeout: 8000,
		env: {
			SYSADMIN_EMAIL: "sysadmin@tkams.local",
			SYSADMIN_PASSWORD: "Admin1234!",
			ADMIN_EMAIL: "admin@lycee-bilingue.local",
			ADMIN_PASSWORD: "Admin1234!",
			TEACHER_EMAIL: "teacher@lycee-bilingue.local",
			TEACHER_PASSWORD: "Teacher1234!",
		},
	},
});
