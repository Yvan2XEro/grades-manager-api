import { execSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "cypress";

function runSeed() {
	try {
		execSync("bun run --filter server seed", {
			stdio: "inherit",
			cwd: path.resolve(__dirname, "..", ".."),
		});
		return true;
	} catch (error) {
		console.error("Failed to seed database", error);
		return false;
	}
}

export default defineConfig({
	e2e: {
		baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:4173",
		specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
		supportFile: "cypress/support/e2e.ts",
		env: {
			API_URL: process.env.CYPRESS_API_URL ?? "http://localhost:3000",
			ADMIN_EMAIL: process.env.CYPRESS_ADMIN_EMAIL ?? "admin@example.com",
			ADMIN_PASSWORD: process.env.CYPRESS_ADMIN_PASSWORD ?? "ChangeMe123!",
			TEACHER_EMAIL:
				process.env.CYPRESS_TEACHER_EMAIL ?? "alice.teacher@example.com",
			TEACHER_PASSWORD: process.env.CYPRESS_TEACHER_PASSWORD ?? "Password123!",
			DEAN_EMAIL: process.env.CYPRESS_DEAN_EMAIL ?? "admin@example.com",
			DEAN_PASSWORD: process.env.CYPRESS_DEAN_PASSWORD ?? "ChangeMe123!",
		},
		setupNodeEvents(on) {
			on("task", {
				resetDB: runSeed,
			});
		},
	},
	fixturesFolder: "cypress/fixtures",
	videosFolder: "cypress/videos",
	screenshotsFolder: "cypress/screenshots",
});
