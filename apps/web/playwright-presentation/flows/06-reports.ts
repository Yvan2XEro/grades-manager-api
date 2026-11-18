/**
 * Flow 06 — Exports, Reports & System administration
 *
 * User questions this flow answers:
 *  - "How do I generate a complete transcript to print?"
 *  - "How do I configure and customize export templates?"
 *  - "How do I monitor system health and running jobs?"
 *  - "How do I set up the integration with the external diploma system?"
 *  - "Where do I see the notifications sent to students and teachers?"
 *  - "How do I manage automatic registration numbers?"
 */
import { test } from "@playwright/test";
import { capture, loginAs, pause, SEED_DATA } from "../fixtures/auth";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Generate and export a cohort's transcript
// Question: "How do I produce the official grades document for class INF25?"
// ─────────────────────────────────────────────────────────────────────────────
test("14 - Export des notes : relevé officiel par classe", async ({ page }) => {
	await loginAs(page, "admin");

	// ── STEP 1: Grade export page ─────────────────────────────────────────────
	await page.goto("/admin/grade-export");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "06g-grade-export-landing");

	// ── STEP 2: Filter by class INF25-BTS1A ───────────────────────────────────
	// "I want the full transcript of nursing class A"
	const classFilter = page.locator('[data-testid="class-select"]').first();
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(700);
		const infOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.infirmierA}")`)
			.first();
		if (await infOption.isVisible()) {
			await infOption.click();
		} else {
			await page.locator('[role="option"]').first().click();
		}
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "06h-export-inf25-filtre");
	}

	// ── STEP 3: See the full grade table per course ───────────────────────────
	// Columns: Student | Anatomy | Physiology | Care | Average | Decision
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(600);
	await capture(page, "06i-export-table-notes-entetes");

	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06j-export-table-notes-corps");

	// Hover over the student rows
	const studentRows = page.locator("table tbody tr");
	const count = await studentRows.count();
	for (let i = 0; i < Math.min(count, 4); i++) {
		await studentRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "06k-export-lignes-etudiants-survol");

	// ── STEP 4: Export button — the available formats ─────────────────────────
	// "Can I export to PDF, Excel, or CSV?"
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);
	const exportBtn = page
		.locator(
			'button:has-text("Exporter"), button:has-text("Export"), button:has-text("Télécharger"), button:has-text("Download")',
		)
		.first();
	if (await exportBtn.isVisible()) {
		await exportBtn.scrollIntoViewIfNeeded();
		await exportBtn.hover();
		await pause(800);
		await capture(page, "06l-bouton-export-hover");

		// If there is a dropdown menu with formats
		await exportBtn.click();
		await pause(700);
		const exportMenu = page
			.locator('[role="menu"], [data-testid*="export-menu"]')
			.first();
		if (await exportMenu.isVisible()) {
			await capture(page, "06m-export-menu-formats");
			await page.keyboard.press("Escape");
			await pause(400);
		} else {
			await capture(page, "06m-export-lance");
		}
	}

	// ── STEP 5: Switch class — COMPT25-BTS1A ──────────────────────────────────
	if (await classFilter.isVisible()) {
		await classFilter.click();
		await pause(600);
		const comptaOption = page
			.locator(`[role="option"]:has-text("${SEED_DATA.classes.comptaA}")`)
			.first();
		if (await comptaOption.isVisible()) {
			await comptaOption.click();
			await page.waitForLoadState("networkidle");
			await pause(1100);
			await capture(page, "06n-export-compta-filtre");

			await page.evaluate(() =>
				window.scrollTo({ top: 300, behavior: "smooth" }),
			);
			await pause(700);
			await capture(page, "06o-export-compta-table");
		} else {
			await page.keyboard.press("Escape");
		}
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Configure custom export templates
// Question: "How do I create a transcript template in the institution's colors?"
// ─────────────────────────────────────────────────────────────────────────────
test("15 - Templates d'export : configuration et personnalisation", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: List of existing export templates ─────────────────────────────
	await page.goto("/admin/export-templates");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "06p-export-templates-liste");

	// ── STEP 2: Hover over the available templates ────────────────────────────
	const templates = page.locator("table tbody tr, [class*='card']");
	const count = await templates.count();
	for (let i = 0; i < Math.min(count, 4); i++) {
		await templates.nth(i).hover();
		await pause(450);
	}
	if (count > 0) await capture(page, "06q-templates-survol");

	// ── STEP 3: Open a template to see its structure ──────────────────────────
	// "How is the official transcript template configured?"
	if (await templates.first().isVisible()) {
		await templates.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "06r-template-detail-structure");

		// See the full configuration
		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(800);
		await capture(page, "06s-template-detail-config");

		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "06t-template-detail-bas");

		// Configuration tabs
		const tabs = page.locator('[role="tab"]');
		const tabCount = await tabs.count();
		for (let i = 1; i < Math.min(tabCount, 3); i++) {
			await tabs.nth(i).click();
			await pause(800);
			await capture(page, `06u-template-onglet-${i}`);
		}

		await page.goBack();
		await pause(600);
	}

	// ── STEP 4: Grade entry delegation ────────────────────────────────────────
	// "How do I allow a grade-editor to enter grades on a specific exam?"
	await page.goto("/admin/grade-access");
	await page.waitForLoadState("networkidle");
	await pause(1300);
	await capture(page, "06v-grade-access-delegation-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "06w-grade-access-delegation-details");

	// Hover over the delegation grants
	const delegateRows = page.locator("table tbody tr, [class*='card']");
	const delegateCount = await delegateRows.count();
	for (let i = 0; i < Math.min(delegateCount, 3); i++) {
		await delegateRows.nth(i).hover();
		await pause(400);
	}
	if (delegateCount > 0) await capture(page, "06x-delegation-survol-details");
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: System monitoring, batch jobs and technical administration
// Question: "How do I monitor system health? Where do I see errors?"
// ─────────────────────────────────────────────────────────────────────────────
test("16 - Monitoring, batch jobs et administration système", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: Monitoring dashboard ──────────────────────────────────────────
	// "Is everything working correctly? Are there any errors?"
	await page.goto("/admin/monitoring");
	await page.waitForLoadState("networkidle");
	await pause(1500);
	await capture(page, "06y-monitoring-overview");

	// Technical KPIs: running jobs, pending notifications, errors...
	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(900);
	await capture(page, "06z-monitoring-kpis-techniques");

	await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07a-monitoring-bas-graphiques");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 2: Batch jobs — heavy background tasks ───────────────────────────
	// "How do I run a bulk student import or a data migration?"
	await page.goto("/admin/batch-jobs");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07b-batch-jobs-liste");

	// Hover over the available jobs
	const jobs = page.locator("table tbody tr, [class*='card']");
	const jobCount = await jobs.count();
	if (jobCount > 0) {
		for (let i = 0; i < Math.min(jobCount, 3); i++) {
			await jobs.nth(i).hover();
			await pause(450);
		}
		await capture(page, "07c-batch-job-survol");

		// Open a job to see its logs and run history
		await jobs.first().click();
		await page.waitForLoadState("networkidle");
		await pause(1200);
		await capture(page, "07d-batch-job-detail-status");

		await page.evaluate(() =>
			window.scrollTo({ top: 400, behavior: "smooth" }),
		);
		await pause(800);
		await capture(page, "07e-batch-job-logs-progression");

		await page.evaluate(() =>
			window.scrollTo({ top: 800, behavior: "smooth" }),
		);
		await pause(700);
		await capture(page, "07f-batch-job-historique-executions");

		await page.goBack();
		await pause(500);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Institution, external integration and API keys
// Question: "How do I set up the integration with the diploma system?"
// ─────────────────────────────────────────────────────────────────────────────
test("17 - Configuration institution, API keys et notifications", async ({
	page,
}) => {
	await loginAs(page, "admin");

	// ── STEP 1: INSES institution record ──────────────────────────────────────
	// "How do I edit the institution's official information?"
	await page.goto("/admin/institution");
	await page.waitForLoadState("networkidle");
	await pause(1400);
	await capture(page, "07g-institution-inses-entete");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(900);
	await capture(page, "07h-institution-coordonnees-contact");

	await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07i-institution-configuration-systeme");
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
	await pause(500);

	// ── STEP 2: Automatic registration numbers ────────────────────────────────
	// "How is the number INSES25-0001 generated? Can it be customized?"
	await page.goto("/admin/registration-numbers");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07j-numeros-inscription-config");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07k-numeros-inscription-format");

	// ── STEP 3: API keys for the external diploma system ──────────────────────
	// "How does the external institution access the diploma data?"
	await page.goto("/admin/api-keys");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07l-api-keys-gestion");

	// The raw key is never visible — only the hash
	await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07m-api-keys-table-hashes");

	// "Create a new key" button
	const createKeyBtn = page
		.locator(
			'button:has-text("Créer"), button:has-text("Create"), button:has-text("Generate"), button:has-text("Ajouter")',
		)
		.first();
	if (await createKeyBtn.isVisible()) {
		await createKeyBtn.scrollIntoViewIfNeeded();
		await createKeyBtn.hover();
		await pause(600);
		await capture(page, "07n-bouton-creer-api-key-hover");
		await createKeyBtn.click();
		await pause(900);
		await capture(page, "07o-formulaire-creation-api-key");
		await page.keyboard.press("Escape");
		await pause(400);
	}

	// ── STEP 4: Sent notifications ────────────────────────────────────────────
	// "How do I check that the email notifications were actually sent?"
	await page.goto("/admin/notifications");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07p-notifications-liste");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(800);
	await capture(page, "07q-notifications-detail-envois");

	// Hover over the recent notifications
	const notifRows = page.locator("table tbody tr");
	const notifCount = await notifRows.count();
	for (let i = 0; i < Math.min(notifCount, 4); i++) {
		await notifRows.nth(i).hover();
		await pause(400);
	}
	if (notifCount > 0) await capture(page, "07r-notifications-survol-statut");

	// ── STEP 5: User and domain management ────────────────────────────────────
	// "How do I create a teacher or admin account in the system?"
	await page.goto("/admin/users");
	await page.waitForLoadState("networkidle");
	await pause(1200);
	await capture(page, "07s-users-liste-complete");

	await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
	await pause(700);
	await capture(page, "07t-users-liste-roles");

	// Hover over the users to see their roles
	const userRows = page.locator("table tbody tr");
	const userCount = await userRows.count();
	for (let i = 0; i < Math.min(userCount, 4); i++) {
		await userRows.nth(i).hover();
		await pause(400);
	}
	await capture(page, "07u-users-survol-roles");
});
