import { expect, type Page } from "@playwright/test";

// ─── Accounts created by the seed (20-users.yaml) ──────────────────────────────
export const CREDENTIALS = {
	admin: {
		email: "admin@inses.cm",
		password: "ChangeMe123!",
		dashboardPath: "/admin",
		displayName: "Administrateur INSES",
	},
	teacher: {
		email: "dr.mballa@inses.cm",
		password: "Password123!",
		dashboardPath: "/teacher",
		displayName: "Dr. Mballa Jean",
	},
	teacher2: {
		email: "kombo@inses.cm",
		password: "Password123!",
		dashboardPath: "/teacher",
		displayName: "Kombo Francis",
	},
	student: {
		email: "ndong.student@inses.cm",
		password: "Password123!",
		dashboardPath: "/student",
		displayName: "Ndong Alain",
	},
} as const;

// ─── Seeded business data ──────────────────────────────────────────────────────
export const SEED_DATA = {
	institution: {
		name: "INSES - Institut Supérieur de l'Espoir",
		slug: "inses-institution",
		code: "INSES",
	},
	academicYear: {
		label: "2025-2026",
	},
	classes: {
		infirmierA: "INF25-BTS1A",
		infirmierB: "INF25-BTS1B",
		comptaA: "COMPT25-BTS1A",
	},
	courses: {
		anatomie: "Anatomie Humaine", // ANAT101
		physiologie: "Physiologie", // PHYS101
		soins: "Soins de Base", // SOIN101
		compta: "Introduction à la Comptabilité", // COMPT101
		comptaAnalytique: "Comptabilité Analytique", // COMPT102
		finance: "Gestion Financière", // FIN101
	},
	exams: {
		anatomieCC: "Contrôle Continu Anatomie",
		comptaCC: "Contrôle Continu Comptabilité",
	},
	students: {
		infirmier: { name: "Ndong Alain", registration: "INSES25-0001" },
		compta: { name: "Eyebe Rachel", registration: "INSES25-0002" },
		transfer: { name: "Pierre Transfert", registration: "INSES25-0010" },
	},
	programs: [
		"BTS Sciences Infirmières",
		"BTS Comptabilité et Gestion",
		"BTS Sage-Femme",
		"BTS Kinésithérapie",
	],
	examTypes: ["CC", "TP", "TPE", "FINAL"],
} as const;

export type Role = keyof typeof CREDENTIALS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Signs a user in and waits for the dashboard to load.
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
	const { email, password, dashboardPath } = CREDENTIALS[role];

	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");

	await page.locator("#email").fill(email);
	await page.locator("#password").fill(password);
	await page.locator('button[type="submit"]').click();

	await page.waitForURL(`**${dashboardPath}**`, { timeout: 20_000 });
	await expect(page.locator("main")).toBeVisible();
}

/**
 * Takes a named PNG screenshot in presentation-assets/screenshots/.
 */
export async function capture(page: Page, name: string): Promise<void> {
	await page.waitForLoadState("networkidle");
	await page.screenshot({
		path: `presentation-assets/screenshots/${name}.png`,
		fullPage: false,
	});
}

/**
 * Visible pause in the video (gives time to read the screen).
 */
export async function pause(ms = 1200): Promise<void> {
	await new Promise((r) => setTimeout(r, ms));
}
